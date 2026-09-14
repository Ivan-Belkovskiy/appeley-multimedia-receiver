export const dynamic = 'force-dynamic';

import { getInternetRadioStations } from "./actions";
import "./page.css";
import HomePage from "@/components/HomePage/HomePage";


export default async function Home() {

  const res = await getInternetRadioStations();

  return (
    <HomePage internetRadioStations={res.data || []} />
  )
}
