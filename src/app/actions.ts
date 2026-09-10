'use server';

import { FolderEntry } from "@/components/FileNavigationModal/FileNavigationModal";
import { MainControllerInputs, MainControllerOutputs } from "@/components/Receiver/MainController/MainController";
import { USBEditingData } from "@/components/USBCreateModal/USBCreateModal";
import { prisma } from "@/lib/prisma";
import { Dirent, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { parseFile } from "music-metadata";
import path, { parse } from "path";

import { list, createFolder, put, del } from "@vercel/blob";

const EXTENSIONS_AUDIO = [".mp3", ".wma", ".wav"];
const EXTENSIONS_VIDEO = [".mp4"];

export async function getNavigationData(usbId: number) {
    try {
        if (!usbId) return { success: false, error: "USB ID not provided!" };

        const prefix = `USB${usbId}/`;
        const { blobs } = await list({ prefix });

        const foldersMap = new Map<string, {
            name: string;
            path: string;
            trackList: { name: string; url: string; type: "audio" | "video" }[];
        }>();

        for (const blob of blobs) {
            const relative = blob.pathname.slice(prefix.length);
            if (!relative) continue;

            if (relative.endsWith("/")) {
                const folderPath = relative.slice(0, -1);
                if (!foldersMap.has(folderPath)) {
                    foldersMap.set(folderPath, {
                        name: path.posix.basename(folderPath),
                        path: folderPath,
                        trackList: [],
                    });
                }
                continue;
            }

            const lastSlash = relative.lastIndexOf("/");
            const folderPath = lastSlash === -1 ? "" : relative.slice(0, lastSlash);
            const fileName = lastSlash === -1 ? relative : relative.slice(lastSlash + 1);

            const ext = path.posix.extname(fileName).toLowerCase();
            const isAudio = EXTENSIONS_AUDIO.includes(ext);
            const isVideo = EXTENSIONS_VIDEO.includes(ext);
            if (!isAudio && !isVideo) continue; 

            if (!foldersMap.has(folderPath)) {
                foldersMap.set(folderPath, {
                    name: folderPath ? path.posix.basename(folderPath) : "/",
                    path: folderPath,
                    trackList: [],
                });
            }

            foldersMap.get(folderPath)!.trackList.push({
                name: fileName,
                url: blob.url,                    
                type: isAudio ? "audio" : "video",
            });
        }

        const data = Array.from(foldersMap.values())
            .sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))
            .map((f, idx) => ({
                number: idx,
                name: f.name,
                path: f.path,
                isEmpty: f.trackList.length === 0,
                trackList: f.trackList.sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, { numeric: true })
                ),
            }));

        return { success: true, data };
    } catch (error) {
        console.error("getNavigationData error:", error);
        return { success: false, error: String(error) };
    }
}

import { parseBuffer } from "music-metadata";

export async function getTrackID3(trackUrl: string) {
    try {
        if (!trackUrl) throw new Error("Track URL not provided!");

        const res = await fetch(trackUrl);
        if (!res.ok) throw new Error(`Failed to fetch track: ${res.status}`);

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get("content-type") || undefined;

        const metadata = await parseBuffer(buffer, contentType, {
            duration: true,
            skipCovers: true,
        });

        return { success: true, id3: metadata };
    } catch (error) {
        console.error("getTrackID3 error:", error);
        return { success: false, error: String(error) };
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
    id?: number;
    name: string;
    style: {
        primaryColor: string;
        secondaryColor: string;
    },
}

export async function getUSBData(): Promise<{ success: boolean; data?: USBFlashInfo[]; error?: any }> {
    try {

        const res = await prisma.usb_devices.findMany({});

        return {
            success: true, data: res.map(usb => ({
                id: usb.id,
                name: usb.name,
                style: {
                    primaryColor: usb.primaryColor,
                    secondaryColor: usb.secondaryColor
                }
            }))
        }

        // const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        // if (!existsSync(usbDataPath)) mkdirSync(usbDataPath, {
        //     recursive: true,
        // });

        // const usbJsonPath = path.join(usbDataPath, 'usb.appeley');

        // if (!existsSync(usbJsonPath)) {
        //     const newData: any[] = [];

        //     writeFileSync(usbJsonPath, JSON.stringify(newData));
        //     return { success: true, data: newData };
        // } else {
        //     const data = readFileSync(usbJsonPath, {
        //         encoding: 'utf-8',
        //     });

        //     return { success: true, data: JSON.parse(data) };
        // }




    } catch (error) {
        return { success: false, error: "" };
    }
}

export async function createUSBFlash(editing: USBEditingData) {
    try {

        const created = await prisma.usb_devices.create({
            data: {
                name: editing.name,
                primaryColor: editing.style.primaryColor,
                secondaryColor: editing.style.secondaryColor,
            }
        });

        const data = await createFolder(`USB${created.id}/`);

        return await getUSBData();

        // return { success: true, data: data };

        // await getUSBData();

        // const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        // const usbJsonPath = path.join(usbDataPath, 'usb.appeley');


        // const data = readFileSync(usbJsonPath, {
        //     encoding: 'utf-8',
        // });

        // const newUSBData: USBFlashInfo[] = JSON.parse(data);

        // if (Array.isArray(newUSBData)) {
        //     newUSBData.push({
        //         ...editing,
        //     });
        // }

        // mkdirSync(path.join(usbDataPath, editing.name), {
        //     recursive: true
        // });

        // const res = writeFileSync(usbJsonPath, JSON.stringify(newUSBData));

        // return { success: true, data: newUSBData };


    } catch (error) {
        return { success: false, error: "" };
    }
}

export async function deleteUSBFlash(id: number) {
    try {

        const deleted = await prisma.usb_devices.delete({
            where: {
                id,
            }
        });

        return await getUSBData();
        // return { success: true, data: deleted };

        // await getUSBData();

        // const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        // const usbJsonPath = path.join(usbDataPath, 'usb.appeley');


        // const data = readFileSync(usbJsonPath, {
        //     encoding: 'utf-8',
        // });

        // let newUSBData: USBFlashInfo[] = JSON.parse(data);

        // if (Array.isArray(newUSBData)) {
        //     newUSBData = newUSBData.filter(usb => usb.name !== name);
        // }

        // const res = writeFileSync(usbJsonPath, JSON.stringify(newUSBData));

        // return { success: true, data: newUSBData };


    } catch (error) {
        return { success: false, error: "" };
    }
}

const USB_ROOT = "USB";

function buildPrefix(usbId: number, nextPath: string = ""): string {
    const clean = nextPath.replace(/^\/+|\/+$/g, "");
    const base = `${USB_ROOT}${usbId}/`;
    return clean ? `${base}${clean}/` : base;
}

export async function getUSBFiles(usbId: number, nextPath: string = "") {
    try {
        if (!usbId) return { success: false, error: "ID not provided!" };

        const prefix = buildPrefix(usbId, nextPath);

        const data = await list({
            prefix,
            mode: "folded",
        });

        return {
            success: true,
            data: [
                ...data.blobs.map((blob) => ({
                    name: blob.pathname.slice(prefix.length),
                    isDirectory: false,
                    url: blob.url,
                    size: blob.size,
                })),
                ...data.folders.map((f) => ({
                    name: path.posix.basename(f.replace(/\/$/, "")),
                    isDirectory: true,
                })),
            ],
        };
    } catch (error) {
        console.error("getUSBFiles error:", error);
        return { success: false, error: String(error) };
    }
}

export async function createUSBFolder(
    usbId: number,
    nextPath: string,
    folderName: string
) {
    try {
        if (!usbId) return { success: false, error: "ID not provided!" };

        const cleanNext = nextPath.replace(/^\/+|\/+$/g, "");
        const folderPath = cleanNext
            ? `${USB_ROOT}${usbId}/${cleanNext}/${folderName}/`  
            : `${USB_ROOT}${usbId}/${folderName}/`;

        await createFolder(folderPath);

        return await getUSBFiles(usbId, nextPath);
    } catch (error) {
        console.error("createUSBFolder error:", error);
        return { success: false, error: String(error) };
    }
}

export async function enterUSBFolder(
    usbId: number,
    nextPath: string,
    folderName: string
) {
    try {
        const newNextPath = path.posix.join(nextPath, folderName);
        const res = await getUSBFiles(usbId, newNextPath);

        return {
            ...res,
            path: res.success ? newNextPath : undefined,
        };
    } catch (error) {
        console.error("enterUSBFolder error:", error);
        return { success: false, error: String(error), path: undefined };
    }
}

export async function moveToParentUSBFolder(usbId: number, nextPath: string) {
    try {
        const parts = nextPath.split("/").filter(Boolean);
        parts.pop();
        const newPath = parts.join("/");

        const res = await getUSBFiles(usbId, newPath);
        return {
            ...res,
            path: res.success ? newPath : undefined,
        };
    } catch (error) {
        console.error("moveToParentUSBFolder error:", error);
        return { success: false, error: String(error), path: undefined };
    }
}

export async function uploadFilesToUSBFolder(
    usbId: number,
    nextPath: string,
    formData: FormData
) {
    try {
        if (!usbId) return { success: false, error: "ID not provided!" };

        const prefix = buildPrefix(usbId, nextPath);

        for (const [, value] of formData) {
            if (value instanceof File) {
                const bytes = await value.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const blobPath = `${prefix}${value.name}`;
                await put(blobPath, buffer, {
                    access: "public",
                    contentType: value.type || "application/octet-stream",
                });
            }
        }

        return await getUSBFiles(usbId, nextPath);
    } catch (error) {
        console.error("uploadFilesToUSBFolder error:", error);
        return { success: false, error: String(error) };
    }
}