import express from "express";
import path from "node:path";
import stream from "node:stream";
import fs from "node:fs/promises";
import EventEmitter from "node:events";
import morgan from "morgan";
import archiver from "archiver";

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

class WriteFile extends stream.Writable {
	filename: string = "folder.zip";

	private buf: Buffer = Buffer.alloc(0);

	constructor(filename: string, options?: stream.WritableOptions) {
		super(options);

		this.filename = filename;
	}

	_write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		this.buf = Buffer.concat([this.buf, chunk]);
		callback();
	}

	create(): File {
		return new File([this.buf], this.filename);
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
		.route(/./)
		.get(async (req, res) => {
			try {
				const url = req.url.split(path.posix.sep);
				const read = path.join(serve, ...url); // the path to read the contents inside

				const ent = await directoryOrFile(read, req.url);
				const options = { root: req.url === "/", downloadUrl: null, download: false }; // the default options

				if (ent instanceof Buffer) {
					return res.render("file", {
						filepath: req.url,
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
				const url = req.url.split(path.posix.sep);
				const read = path.join(serve, ...url);

				const ent = await directoryOrFile(read, req.url);
				const options: { root: boolean; downloadUrl: null | string; download: boolean } = {
					root: req.url === "/",
					downloadUrl: null,
					download: false,
				};
				const filename = path.basename(read);

				if (ent instanceof Buffer) {
					const file = new File([ent], filename);

					itf.emit("share", file);
					return itf.once("tunnel", (url) => {
						options.downloadUrl = url;

						res.render("file", {
							filepath: req.url,
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

function createZipFromFolder(folder_path: string): Promise<File> {
	return new Promise((res, rej) => {
		const zip = archiver("zip");
		const file = new WriteFile(path.basename(folder_path) + ".zip");

		let total_size = 0;

		zip.on("data", (chunk) => {
			const size = chunk.length / 1024 / 1000; // size in megabytes

			total_size += size;

			console.clear();
			console.log("progress:", total_size, "MB");
			console.log("archiving...");
		});
		zip.on("close", () => console.log("archive finished.."));
		zip.on("error", rej);

		zip.pipe(file).on("close", () => res(file.create()));

		zip.directory(folder_path, false);
		zip.finalize();
	});
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
