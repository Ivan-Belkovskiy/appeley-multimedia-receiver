'use server';

import { MainControllerInputs, MainControllerOutputs } from "@/components/Receiver/MainController/MainController";
import { Dirent, existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { parseFile } from "music-metadata";
import path from "path";

export async function getNavigationData(url?: string) {
    // const usbContentsPath = url || 'D:\\Media\\Music\\FOR_USB_32GB\\01_Music_by_VilkiElense\\! NEW (For Recording)';
    const usbContentsPath = 'D:\\Media';
    const data = readdirSync(usbContentsPath, {
        // recursive: true,
        withFileTypes: true,
    }).filter(dir => dir.isDirectory());


    // Write Log File //



    // if (!existsSync(process.cwd())) {
    // writeFileSync(path.join(process.cwd(), 'log.txt'), '')
    // } else fileS

    let folders: Partial<Dirent<string> & { isEmpty: boolean; trackList: string[] }>[] = [];

    const readDirContents = (data: Dirent<string>[], counter: number = 0) => new Promise((resolve: (val: { success: boolean, error?: any }) => void, reject) => {
        data.forEach(dir => {
            try {
                let innerDirContents = readdirSync(path.join(dir.parentPath, dir.name), { withFileTypes: true });
                folders.push({
                    ...dir,
                    isEmpty: (innerDirContents.filter(entry => entry.isFile() && ['.mp3', '.wav', '.wma'].includes(path.extname(entry.name).toLowerCase())).length === 0),
                    // trackCount: innerDirContents.filter(entry => entry.isFile() && ['.mp3', '.wav', '.wma'].includes(path.extname(entry.name).toLowerCase())).length,
                    trackList: innerDirContents.filter(entry => entry.isFile() && ['.mp3', '.wav', '.wma'].includes(path.extname(entry.name).toLowerCase())).map(ent => ent.name)
                });
                if (counter < 8) readDirContents(innerDirContents.filter(dir => dir.isDirectory()), (counter + 1));
            } catch (error) {
                console.error('Reading folder error', error);
                resolve({ success: false, error })
                // reject(error);
            }
        });
        resolve({ success: true });
    });

    const result = await readDirContents(data);


    // const folders = data.filter(dir => dir.isDirectory()).sort((a, b) => (
    //     (a.parentPath === b.parentPath) ? -1 : 1
    // ));

    if (result.error) return ({
        success: false,
        error: `Reading Error: ${result.error}`,
    });

    return ({
        success: true,
        data: folders.map((dir, idx) => ({
            number: idx,
            name: dir.name,
            path: path.join(dir.parentPath || "", dir.name || ""),
            isEmpty: dir.isEmpty,
            trackList: dir.trackList,
            // trackCount: dir.trackCount,
        })),

    });
}

export async function getTrackID3(folderUrl: string, trackName: string) {
    let LOG_DATA = `getTrackID3() :: Server Actions Log | ${new Date().toLocaleString()}`;
    try {

        if (!folderUrl || !trackName) throw new Error('Folder Url and Track Name not provided!!!');

        const fullPath = path.join(folderUrl, trackName);

        LOG_DATA += `\n✅ fullPath: ${fullPath}`;

        if (!existsSync(fullPath)) throw new Error('File not found!');


        const metadata = await parseFile(fullPath, {
            duration: true,
            skipCovers: true,
        });

        LOG_DATA += `\n✅ metadata: \n\n${JSON.stringify(metadata, null, 3)}`;

        writeFileSync(path.join(process.cwd(), 'log.txt'), LOG_DATA);

        return { success: true, id3: metadata };

    } catch (error) {
        LOG_DATA += `\n🔺 ERROR: ${error}`;
        writeFileSync(path.join(process.cwd(), 'log.txt'), LOG_DATA);
        return { success: false, error };
    }
}

export async function saveData(inputs: MainControllerInputs, outputs: MainControllerOutputs) {
    try {
        const file = writeFileSync(
            path.join(process.cwd(), 'data.appeley'),
            JSON.stringify({
                inputs,
                outputs,
            })
        );
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

export async function loadData() {
    try {
        const filepath = path.join(process.cwd(), 'data.appeley');

        if (!existsSync(filepath)) return { success: false, error: "File not found" };

        const data = readFileSync(filepath, {
            encoding: 'utf-8'
        });

        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        return { success: false, error };
    }
}