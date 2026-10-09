import { deleteRadioStation, updateRadioStation } from "@/app/actions";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const resolved = await params;
    const id = Number(resolved.id);
    const data = await req.json();

    const res = await updateRadioStation(id, data);

    return NextResponse.json({ ...res });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const resolved = await params;
    const id = Number(resolved.id);

    const res = await deleteRadioStation({ id });

    return NextResponse.json({ ...res });
}