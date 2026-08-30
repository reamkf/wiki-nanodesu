// path/to/ReactScanComponent
"use client";
// react-scan must be imported before react
import { scan } from "react-scan";
import { JSX, useEffect } from "react";

export function ReactScan(): JSX.Element | null {
	useEffect(() => {
		scan({
			enabled: false,
		});
	}, []);

	return null;
}
