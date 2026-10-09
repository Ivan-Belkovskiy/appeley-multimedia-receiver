import { getPlayedRadioTracks } from "@/app/actions";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    const res = await getPlayedRadioTracks();

    return NextResponse.json({
        ...res,
    });
}