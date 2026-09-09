import { existsSync, writeFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function POST(req: NextRequest) {

    let usbName = req.nextUrl.searchParams.get('usbName');
    let nextPath = req.nextUrl.searchParams.get('path');

    if (!usbName || !nextPath) return NextResponse.json({
        success: false,
        error: 'USB Name or path not provided!'
    });

    usbName = decodeURIComponent(usbName);
    nextPath = decodeURIComponent(nextPath);

    try {
        const formData = await req.formData();

        if (!usbName) return NextResponse.json({ success: false, error: "Name not provided!" });

        const usbDataPath = path.join(process.cwd(), 'data', 'usb');

        const current = path.join(usbDataPath, usbName);
        const next = path.normalize(nextPath);

        const fullPath = path.join(current, next);

        if (!existsSync(fullPath)) return NextResponse.json({ success: false, error: "Folder not exists!" });

        for (const [key, value] of formData) {
            if (value instanceof File) {
                const bytes = await value.arrayBuffer();
                const buffer = Buffer.from(bytes);

                const filePath = path.join(fullPath, value.name);

                writeFileSync(filePath, buffer);
            }
        }

        // const data = await getUSBFiles(usbName, nextPath);

        return NextResponse.json({ success: true });


    } catch (error) {
        return NextResponse.json({ success: false, error: "" });
    }

}