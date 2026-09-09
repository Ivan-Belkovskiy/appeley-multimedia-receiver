'use server';

import { FolderEntry } from "@/components/FileNavigationModal/FileNavigationModal";
import { MainControllerInputs, MainControllerOutputs } from "@/components/Receiver/MainController/MainController";
import { USBEditingData } from "@/components/USBCreateModal/USBCreateModal";
import { Dirent, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { parseFile } from "music-metadata";
import path, { parse } from "path";

const EXTENSIONS_AUDIO = [".mp3", ".wma", ".wav"];
const EXTENSIONS_VIDEO = [".mp4"];

export async function getNavigationData(usbDevice?: USBFlashInfo) {
    
    let fullUrl: string | null = null;
    if (usbDevice) {
        const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        fullUrl = path.join(usbDataPath, usbDevice.name);
    }

    const usbContentsPath = fullUrl || 'D:\\Media\\Music\\FOR_USB_32GB\\05_Jazz_Funk_Fusion_Instrumental\\! NEW (for recording)\\FROM MUSIFY.CLUB\\_ Normalized with Audacity';
    const data = readdirSync(usbContentsPath, {
        // recursive: true,
        withFileTypes: true,
    }).filter(dir => dir.isDirectory());


    // Write Log File //



    // if (!existsSync(process.cwd())) {
    // writeFileSync(path.join(process.cwd(), 'log.txt'), '')
    // } else fileS

    let folders: Partial<Dirent<string> & {
        isEmpty: boolean; trackList: {
            name: string;
            type: "audio" | "video";
        }[]
    }>[] = [];

    const readDirContents = (data: Dirent<string>[], counter: number = 0) => new Promise((resolve: (val: { success: boolean, error?: any }) => void, reject) => {
        data.forEach(dir => {
            try {
                let innerDirContents = readdirSync(path.join(dir.parentPath, dir.name), { withFileTypes: true });
                folders.push({
                    ...dir,
                    isEmpty: (innerDirContents.filter(entry => entry.isFile() && [...EXTENSIONS_AUDIO, ...EXTENSIONS_VIDEO].includes(path.extname(entry.name).toLowerCase())).length === 0),
                    // trackCount: innerDirContents.filter(entry => entry.isFile() && ['.mp3', '.wav', '.wma'].includes(path.extname(entry.name).toLowerCase())).length,
                    trackList: innerDirContents.filter(entry => entry.isFile() && [...EXTENSIONS_AUDIO, ...EXTENSIONS_VIDEO].includes(path.extname(entry.name).toLowerCase())).map(ent => ({
                        type: (EXTENSIONS_VIDEO.includes(path.extname(ent.name).toLowerCase())) ? "video" : "audio",
                        name: ent.name,
                    }))
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
            path.join(process.cwd(), 'data', 'data.appeley'),
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
        const filepath = path.join(process.cwd(), 'data', 'data.appeley');

        if (!existsSync(filepath)) return { success: false, error: "File not found" };

        const data = readFileSync(filepath, {
            encoding: 'utf-8'
        });

        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        return { success: false, error };
    }
}



export interface USBFlashInfo {
    name: string;
    style: {
        primaryColor: string;
        secondaryColor: string;
    },
}

export async function getOrInitUSBData(): Promise<{ success: boolean; data?: USBFlashInfo[]; error?: any }> {
    try {

        const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        if (!existsSync(usbDataPath)) mkdirSync(usbDataPath, {
            recursive: true,
        });

        const usbJsonPath = path.join(usbDataPath, 'usb.appeley');

        if (!existsSync(usbJsonPath)) {
            const newData: any[] = [];

            writeFileSync(usbJsonPath, JSON.stringify(newData));
            return { success: true, data: newData };
        } else {
            const data = readFileSync(usbJsonPath, {
                encoding: 'utf-8',
            });

            return { success: true, data: JSON.parse(data) };
        }



    } catch (error) {
        return { success: false, error: "" };
    }
}

export async function createUSBFlash(editing: USBEditingData) {
    try {

        await getOrInitUSBData();

        const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        const usbJsonPath = path.join(usbDataPath, 'usb.appeley');


        const data = readFileSync(usbJsonPath, {
            encoding: 'utf-8',
        });

        const newUSBData: USBFlashInfo[] = JSON.parse(data);

        if (Array.isArray(newUSBData)) {
            newUSBData.push({
                ...editing,
            });
        }

        mkdirSync(path.join(usbDataPath, editing.name), {
            recursive: true
        });

        const res = writeFileSync(usbJsonPath, JSON.stringify(newUSBData));

        return { success: true, data: newUSBData };


    } catch (error) {
        return { success: false, error: "" };
    }
}

export async function deleteUSBFlash(name: string) {
    try {

        await getOrInitUSBData();

        const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        const usbJsonPath = path.join(usbDataPath, 'usb.appeley');


        const data = readFileSync(usbJsonPath, {
            encoding: 'utf-8',
        });

        let newUSBData: USBFlashInfo[] = JSON.parse(data);

        if (Array.isArray(newUSBData)) {
            newUSBData = newUSBData.filter(usb => usb.name !== name);
        }

        const res = writeFileSync(usbJsonPath, JSON.stringify(newUSBData));

        return { success: true, data: newUSBData };


    } catch (error) {
        return { success: false, error: "" };
    }
}

export async function getUSBFiles(name: string, nextPath: string) {
    try {

        if (!name) return { success: false, error: "Name not provided!" };

        const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        // const usbJsonPath = path.join(usbDataPath, 'usb.appeley');

        const current = path.join(usbDataPath, name);
        const next = path.normalize(nextPath);

        const fullPath = path.join(current, next);

        if (!existsSync(fullPath)) return { success: false, error: "USB Flash not found!" };

        const data = readdirSync(fullPath, {
            withFileTypes: true,
        })/*.sort((a, b) => */;

        return {
            success: true, data: data.map(ent => ({
                name: ent.name,
                parentPath: ent.parentPath,
                isDirectory: ent.isDirectory()
            }))
        };


    } catch (error) {
        return { success: false, error: "" };
    }
}

export async function createUSBFolder(usbName: string, nextPath: string, folderName: string) {
    try {

        if (!usbName) return { success: false, error: "Name not provided!" };

        const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        const current = path.join(usbDataPath, usbName);
        const next = path.normalize(nextPath);

        const fullPath = path.join(current, next);

        if (!existsSync(fullPath)) return { success: false, error: "Folder not exists!" };

        mkdirSync(path.join(fullPath, folderName));

        return { success: true };


    } catch (error) {
        return { success: false, error: "" };
    }
}

export async function enterUSBFolder(usbName: string, nextPath: string, folderName: string) {
    try {

        if (!usbName) return { success: false, error: "Name not provided!" };

        const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        const current = path.join(usbDataPath, usbName);
        const next = path.normalize(nextPath);

        const fullPath = path.join(current, next, folderName);

        if (!existsSync(fullPath)) return { success: false, error: "Folder not exists!" };

        const newNextPath = path.join(nextPath, folderName);
        const data = await getUSBFiles(usbName, newNextPath);

        return { success: true, data: data.data, path: newNextPath };


    } catch (error) {
        return { success: false, error: "" };
    }
}

export async function moveToParentUSBFolder(usbName: string, nextPath: string) {
    try {

        if (!usbName) return { success: false, error: "Name not provided!" };

        const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        const current = path.join(usbDataPath, usbName);
        const next = path.normalize(nextPath);

        const fullPath = path.join(current, next);

        if (!existsSync(fullPath)) return { success: false, error: "Folder not exists!" };

        const newNextPath = path.normalize(`${next}/..`);

        const data = await getUSBFiles(usbName, newNextPath);

        return { success: true, data: data.data, path: newNextPath };


    } catch (error) {
        return { success: false, error: "" };
    }
}

export async function uploadFilesToUSBFolder(usbName: string, nextPath: string, formData: FormData) {
    try {

        if (!usbName) return { success: false, error: "Name not provided!" };

        const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        const current = path.join(usbDataPath, usbName);
        const next = path.normalize(nextPath);

        const fullPath = path.join(current, next);

        if (!existsSync(fullPath)) return { success: false, error: "Folder not exists!" };

        for (const [key, value] of formData) {
            if (value instanceof File) {
                const bytes = await value.arrayBuffer();
                const buffer = Buffer.from(bytes);

                const filePath = path.join(fullPath, value.name);
                
                writeFileSync(filePath, buffer);
            }
        }

        const data = await getUSBFiles(usbName, nextPath);

        return { success: true, data: data.data, path: nextPath };


    } catch (error) {
        return { success: false, error: "" };
    }
}