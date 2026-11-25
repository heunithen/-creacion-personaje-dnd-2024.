export type GithubConfig = { token: string; owner: string; repo: string; branch: string };
export type GithubCharacterRecord = { playerId: string; playerName: string; name: string; path: string; folder: string; updatedAt: string; targetFolder?: string };
export type GithubCharacterIndex = { folders: string[]; characters: GithubCharacterRecord[] };

const ROOT = 'personajes';
const API = 'https://api.github.com';

function encodeContent(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}
function decodeContent(value: string) {
  return decodeURIComponent(escape(atob(value.replace(/\s/g, ''))));
}
function encodePath(path: string) {
  return path.split('/').map(part => encodeURIComponent(part)).join('/');
}

export class GithubCharacterStorage {
  constructor(private config: GithubConfig) {}

  private async request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${API}/repos/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.config.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {})
      }
    });
    if (!response.ok) {
      let detail = '';
      try { detail = (await response.json()).message || ''; } catch {}
      throw new Error(`GitHub ${response.status}${detail ? ': ' + detail : ''}`);
    }
    return response.status === 204 ? null : response.json();
  }

  private async getFile(path: string): Promise<any | null> {
    const response = await fetch(`${API}/repos/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}/contents/${encodePath(path)}?ref=${encodeURIComponent(this.config.branch)}`, {
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${this.config.token}`, 'X-GitHub-Api-Version': '2022-11-28' }
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`No se pudo leer ${path} en GitHub (${response.status}).`);
    return response.json();
  }

  private async writeFile(path: string, content: string, message: string) {
    // GitHub can return 409 if another player updates the index between
    // reading its SHA and writing it. Re-read the latest SHA and retry.
    for (let attempt = 0; attempt < 5; attempt++) {
      const current = await this.getFile(path);
      const body: any = { message, content: encodeContent(content), branch: this.config.branch };
      if (current?.sha) body.sha = current.sha;
      try {
        return await this.request(`/contents/${encodePath(path)}`, { method: 'PUT', body: JSON.stringify(body) });
      } catch (error) {
        const messageText = error instanceof Error ? error.message : String(error);
        if (!messageText.includes('GitHub 409') || attempt === 4) throw error;
        await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }

  private async deleteFile(path: string, message: string) {
    const current = await this.getFile(path);
    if (!current?.sha) return;
    await this.request(`/contents/${encodePath(path)}`, { method: 'DELETE', body: JSON.stringify({ message, sha: current.sha, branch: this.config.branch }) });
  }

  async readIndex(): Promise<GithubCharacterIndex> {
    const file = await this.getFile(`${ROOT}/indice.json`);
    if (!file?.content) return { folders: ['sin-partida'], characters: [] };
    const parsed = JSON.parse(decodeContent(file.content));
    return {
      folders: Array.from(new Set(['sin-partida', ...(Array.isArray(parsed.folders) ? parsed.folders : [])])),
      characters: Array.isArray(parsed.characters) ? parsed.characters : []
    };
  }

  private async writeIndex(index: GithubCharacterIndex) {
    await this.writeFile(`${ROOT}/indice.json`, JSON.stringify(index, null, 2), 'Actualizar índice de personajes');
  }

  private async updateIndex(change: (latest: GithubCharacterIndex) => void) {
    // Rebuild the change from the latest index after a conflict so concurrent
    // character saves and folder operations do not overwrite each other.
    for (let attempt = 0; attempt < 5; attempt++) {
      const latest = await this.readIndex();
      change(latest);
      try {
        await this.writeIndex(latest);
        return;
      } catch (error) {
        const messageText = error instanceof Error ? error.message : String(error);
        if (!messageText.includes('GitHub 409') || attempt === 4) throw error;
        await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }

  private characterPath(folder: string, playerId: string) {
    const safeId = playerId.replace(/[^a-zA-Z0-9_-]/g, '-');
    return folder === 'sin-partida' ? `${ROOT}/sin-partida/${safeId}.json` : `${ROOT}/partidas/${folder}/${safeId}.json`;
  }

  async save(character: any, playerId: string, playerName: string) {
    const initialIndex = await this.readIndex();
    const previous = initialIndex.characters.find(item => item.playerId === playerId);
    const folder = previous?.folder || 'sin-partida';
    const path = previous?.path || this.characterPath(folder, playerId);
    const record: GithubCharacterRecord = {
      playerId, playerName: playerName || 'Jugador', name: character.name || 'Personaje sin nombre',
      path, folder, updatedAt: new Date().toISOString()
    };
    await this.writeFile(path, JSON.stringify({ playerId, playerName, character, updatedAt: record.updatedAt }, null, 2), 'Guardar personaje ' + record.name);
    await this.updateIndex(index => {
      index.characters = [...index.characters.filter(item => item.playerId !== playerId), record];
    });
  }

  async createFolder(name: string) {
    const folder = name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!folder || folder === 'sin-partida') throw new Error('Escribe un nombre válido para la partida.');
    await this.writeFile(`${ROOT}/partidas/${folder}/.gitkeep`, ' ', 'Crear carpeta de partida ' + folder);
    await this.updateIndex(index => {
      if (!index.folders.includes(folder)) index.folders.push(folder);
    });
    return folder;
  }

  async move(record: GithubCharacterRecord, folder: string) {
    if (!folder || folder === record.folder) return;
    const destination = this.characterPath(folder, record.playerId);
    const sourceFile = await this.getFile(record.path);
    if (!sourceFile?.content) throw new Error('No se encontró el archivo original del personaje.');
    if (await this.getFile(destination)) throw new Error('Ya existe un archivo de personaje con ese nombre en la carpeta de destino.');
    await this.writeFile(destination, decodeContent(sourceFile.content), 'Mover personaje ' + record.name);
    await this.deleteFile(record.path, 'Retirar personaje de su carpeta anterior');
    await this.updateIndex(index => {
      index.characters = index.characters.map(item => item.playerId === record.playerId
        ? { ...item, path: destination, folder, updatedAt: new Date().toISOString() }
        : item);
    });
  }

  async remove(record: GithubCharacterRecord) {
    await this.deleteFile(record.path, 'Eliminar personaje ' + record.name);
    await this.updateIndex(index => {
      index.characters = index.characters.filter(item => item.playerId !== record.playerId);
    });
  }
}