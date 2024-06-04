#! /usr/bin/env node

import readline from "node:readline/promises";
import fs from "node:fs/promises";
import path from "node:path";
import { stdin, stdout } from "node:process";
import { Command } from "commander";
import { Listener } from "@ngrok/ngrok";
import { Server } from "node:http";
import "source-map-support/register";

import { name, description, version } from "../package.json";
import itf from "./interface";
import serve from "./serve";
import tunnel, { authentication } from "./tunnel";

namespace Program {
	export type ServeOptions = {
		port?: string;
		interfacePort?: string;
	};
	export type AuthenticationOptions = {
		token?: string;
	};
}

main();

async function main() {
	const chalk = (await import("chalk")).default;
	const program = new Command();

	program.name(name).description(description).version(version);

	program
		.command("serve")
		.argument("<path>", "path where the interface will be based in")
		.option("--p, --port <number>", "the port to serve the files/folders")
		.option("--pi, --interface-port <number>", "the port of the interface")
		.action(async (serve_path, options: Program.ServeOptions) => {
			const interface_port = isNumber(options.interfacePort) || 3000;
			const serve_port = isNumber(options.port) || 3004;

			try {
				const authtoken = await getAuthtoken();
				const itfEmt = await itf(interface_port, serve_path);

				let tunnelListener: Listener | undefined;
				let server: Server | undefined;

				itfEmt.on("share", async (file) => {
					try {
						// Close previous tunnel listener and server, if any
						if (tunnelListener) tunnelListener?.close();
						if (server) server.close();

						tunnelListener = await tunnel({ authtoken, addr: serve_port });
						const url = tunnelListener.url();
						server = await serve(serve_port, file, url);

						if (url) itfEmt.emit("tunnel", url);
					} catch (error) {
						if (error instanceof Error) console.error(error.message);
					}
				});
			} catch (error) {
				if (error instanceof Error) console.error(error.message);
			}
		})
		.description(
			`Serve your files/folders locally or via a network \n\n${chalk.red(
				"NOTE:"
			)} You must first authenticate to your ${chalk.yellowBright(
				"https://ngrok.com"
			)} account to serve via network!!`
		);

	program
		.command("auth")
		.option("-t, --token <string>", "ngrok auth token")
		.description("Authenticate to your ngrok account")
		.action(async (options: Program.AuthenticationOptions) => {
			try {
				const rl = readline.createInterface({ input: stdin, output: stdout });

				while (!options.token) {
					const token = await rl.question(
						`${chalk.yellow("[AUTHENTICATION]")} Your Ngrok authtoken: `
					);
					options.token = token.trim();
				}

				rl.close();

				await authentication(options.token);

				const pathToCredential = path.join(__dirname, "cred.json");
				const json = JSON.stringify({ token: options.token });
				await fs.writeFile(pathToCredential, json, "utf8");

				console.clear();
				console.log(chalk.green("[AUTHENTICATED]"), "You can now serve your files");
			} catch (error) {
				console.clear();
				if (error instanceof Error)
					console.log(chalk.red("[AUTHENTICATION FAILED]"), error.message);
			}
		});

	program.parse();
}

async function getAuthtoken() {
	try {
		const pathToCredential = path.join(__dirname, "cred.json");
		const credential = await fs.readFile(pathToCredential, "utf8");
		const json = JSON.parse(credential);
		const authtoken: string = json.token;

		if (!authtoken) throw new Error();

		return authtoken;
	} catch (error) {
		throw new Error("Auth token does not exist");
	}
}

function isNumber(test: any) {
	const testNum = Number(test);

	return isNaN(testNum) ? false : testNum;
}
