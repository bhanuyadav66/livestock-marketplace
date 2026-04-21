"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
});

export default function MapWrapper({ lat, lng, address }) {
  return <Map lat={lat} lng={lng} address={address} />;
}
