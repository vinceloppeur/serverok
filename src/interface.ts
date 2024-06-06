import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import EventEmitter from "node:events";
import morgan from "morgan";
import admZip from "adm-zip";

namespace Interface {
	type URL = string;
	type SharedFile = [File];
	type Tunnel = [URL];

	export interface Events {
		share: SharedFile;
		tunnel: Tunnel;
	}

	export class Emitter extends EventEmitter.EventEmitter {
		on<K extends keyof Events & string>(
			eventName: K,
			listener: (...args: Interface.Events[K & keyof Interface.Events]) => void | Promise<void>
		): this {
			super.on(eventName, listener as any);
			return this;
		}

		once<K extends keyof Events & string>(
			eventName: K,
			listener: (...args: Interface.Events[K & keyof Interface.Events]) => void | Promise<void>
		): this {
			super.once(eventName, listener as any);
			return this;
		}

		emit<K extends keyof Events & string>(
			eventName: K,
			...args: Interface.Events[K & keyof Interface.Events]
		): boolean {
			return super.emit(eventName, ...args);
		}
	}
}

export default async function main(port: number, serve_path: string) {
	const chalk = (await import("chalk")).default;
	const cwd = process.cwd();
	const serve = path.resolve(cwd, serve_path); // the path to serve | starting point

	const server = express();
	const views = path.join(__dirname, "views");
	const itf = new Interface.Emitter();

	server.use(morgan("dev"));
	server.use(express.urlencoded({ extended: false }));
	server.use("/styles", express.static(path.join(__dirname, "./views/styles")));

	server.set("views", views);
	server.set("view engine", "ejs");

	server
		.route("/:position(*)")
		.get(async (req, res) => {
			try {
				const read = path.join(serve, req.params.position); // the path to read the contents inside
				const ent = await directoryOrFile(read, req.url);
				const options = { root: req.params.position === "", downloadUrl: null, download: false }; // the default options

				if (ent instanceof Buffer) {
					return res.render("file", {
						filepath: options.root ? undefined : req.params.position,
						filename: path.basename(read),
						filesize: ent.byteLength,
						...options,
					});
				}

				res.render("index", { folders: ent.folders, files: ent.files, ...options });
			} catch (error) {
				res.render("not_found");
			}
		})
		.post(async (req, res) => {
			try {
				const read = path.join(serve, req.params.position);
				const ent = await directoryOrFile(read, req.url);
				const options: { root: boolean; downloadUrl: null | string; download: boolean } = {
					root: req.params.position === "",
					downloadUrl: null,
					download: false,
				};
				const filename = path.basename(options.root ? serve : req.params.position);

				if (ent instanceof Buffer) {
					const file = new File([ent], filename);

					itf.emit("share", file);
					return itf.once("tunnel", (url) => {
						options.downloadUrl = url;

						res.render("file", {
							filepath: options.root ? undefined : filename,
							filename,
							filesize: ent.byteLength,
							...options,
						});
					});
				}

				const zip = await createZipFromFolder(read);

				itf.emit("share", zip);
				return itf.once("tunnel", (url) => {
					options.downloadUrl = url;

					res.render("index", { folders: ent.folders, files: ent.files, ...options });
				});
			} catch (error) {
				res.render("not_found");
			}
		});

	server.listen(port, () => {
		console.log(
			chalk.green(`Interface (${serve}):`),
			chalk.yellowBright(`visit: http://localhost:${port}`)
		);
	});

	return itf;
}

async function createZipFromFolder(folder_path: string) {
	const zip = new admZip();

	await zip.addLocalFolderPromise(folder_path, {});

	const buf = await zip.toBufferPromise();
	const file = new File([buf], path.basename(folder_path) + ".zip");

	return file;
}

async function directoryOrFile(from: string, relativePath: string) {
	const directoryOrFile = await fs
		.readdir(from, { withFileTypes: true })
		.catch(async () => await fs.readFile(from));

	if (directoryOrFile instanceof Array) {
		const inodes = directoryOrFile.map((inode) => {
			return {
				name: inode.name,
				isDirectory: inode.isDirectory(),
				path: path.posix.join(relativePath, inode.name),
			};
		});
		const folders = inodes.filter((inode) => inode.isDirectory);
		const files = inodes.filter((inode) => !inode.isDirectory);

		return { folders, files };
	}

	return directoryOrFile;
}
