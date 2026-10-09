import { addRadioStation, getInternetRadioStations, updateRadioStation } from "@/app/actions";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    const res = await getInternetRadioStations();

    return NextResponse.json({
        ...res,
    });
}

export async function POST(req: NextRequest) {
    const data = await req.json();

    const res = await addRadioStation(data);

    return NextResponse.json({ ...res });
}