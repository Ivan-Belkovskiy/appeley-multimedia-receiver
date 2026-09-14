import { FolderInfo } from '@/components/Receiver/MainController/MainController';

const EXTENSIONS_AUDIO = ['.mp3', '.wma', '.wav', '.m4a', '.flac', '.aac', '.ogg'];
const EXTENSIONS_VIDEO = ['.mp4', '.webm', '.mkv', '.mov'];

const MAX_DEPTH = 10;  

export async function buildNavigationFromDirectoryHandle(
    rootHandle: FileSystemDirectoryHandle,
): Promise<FolderInfo[]> {
    const folders: FolderInfo[] = [];
    let folderCounter = 0;

    async function walk(
        dirHandle: FileSystemDirectoryHandle,
        relativePath: string,
        depth: number,
    ) {
        if (depth > MAX_DEPTH) return;

        const trackList: FolderInfo['trackList'] = [];
        const subDirs: FileSystemDirectoryHandle[] = [];

        for await (const [name, entry] of (dirHandle as any).entries()) {
            if (entry.kind === 'directory') {
                subDirs.push(entry);
            } else if (entry.kind === 'file') {
                const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
                const isAudio = EXTENSIONS_AUDIO.includes(ext);
                const isVideo = EXTENSIONS_VIDEO.includes(ext);
                if (!isAudio && !isVideo) continue;

                trackList.push({
                    name,
                    url: '', 
                    type: isAudio ? 'audio' : 'video',
                    fileHandle: entry,
                } as any);
            }
        }

        trackList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        subDirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        if (trackList.length > 0 || depth === 0) {
            folders.push({
                number: folderCounter++,
                name: depth === 0 ? 'ROOT' : dirHandle.name,
                path: relativePath,
                isEmpty: trackList.length === 0,
                trackList,
            });
        }

        for (const sub of subDirs) {
            const subPath = relativePath ? `${relativePath}/${sub.name}` : sub.name;
            await walk(sub, subPath, depth + 1);
        }
    }

    await walk(rootHandle, '', 0);
    return folders;
}