let capturesFolderHandle: FileSystemDirectoryHandle | null = null;

export async function requestCapturesFolder(): Promise<FileSystemDirectoryHandle | null> {
    if (typeof window === 'undefined') return null;
    if (!('showDirectoryPicker' in window)) {
        throw new Error('File System Access API не поддерживается этим браузером');
    }

    if (capturesFolderHandle) {
        try {
            const perm = await (capturesFolderHandle as any).queryPermission({ mode: 'readwrite' });
            if (perm === 'granted') return capturesFolderHandle;

            const req = await (capturesFolderHandle as any).requestPermission({ mode: 'readwrite' });
            if (req === 'granted') return capturesFolderHandle;
        } catch {
            capturesFolderHandle = null;
        }
    }

    try {
        capturesFolderHandle = await (window as any).showDirectoryPicker({
            id: 'appeley-captures',
            mode: 'readwrite',
            startIn: 'music',
        });
        return capturesFolderHandle;
    } catch (err: any) {
        if (err?.name === 'AbortError') return null;
        throw err;
    }
}

export async function saveCaptureToFolder(
    folder: FileSystemDirectoryHandle,
    blob: Blob,
    filename: string,
): Promise<{ fileName: string; sizeBytes: number }> {
    const safeName = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

    const fileHandle = await folder.getFileHandle(safeName, { create: true });
    const writable = await fileHandle.createWritable();

    try {
        await writable.write(blob);
    } finally {
        await writable.close();
    }

    return { fileName: safeName, sizeBytes: blob.size };
}

export async function hashBlob(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}