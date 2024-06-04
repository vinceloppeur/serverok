import path from "node:path";
import express from "express";

export default async function main(port: number, file: File, url?: string | null) {
	const chalk = (await import("chalk")).default;
	const server = express();
	const views = path.join(__dirname, "views");

	server.set("views", views);
	server.set("view engine", "ejs");

	server.use("/styles", express.static(path.join(__dirname, "views/styles")));

	server.get("/", (req, res) => {
		res.render("file", {
			filepath: undefined,
			filename: file.name,
			filesize: file.size,
			root: false,
			downloadUrl: url,
			download: true,
		});
	});

	server.get("/download", async (req, res) => {
		try {
			const fileBuf = Buffer.from(await file.arrayBuffer());

			res.set("Content-Disposition", `attachment; filename="${file.name}"`).send(fileBuf);
		} catch (error) {}
	});

	return server.listen(port, () => {
		console.log(
			"Download link of your file is through",
			chalk.yellow(url ? url : `http://localhost:${port}`)
		);
	});
}
