import ngrok from "@ngrok/ngrok";
import type { Config } from "@ngrok/ngrok";

// Use this to create a tunnel instead
export default async function connect(options: Config) {
	return await ngrok.forward(options);
}

// Only to authenticate to Ngrok
export async function authentication(authtoken: string) {
	try {
		const listener = await ngrok.forward({ authtoken });

		listener.close();
	} catch (error) {
		throw new Error("Authentication failed, please check your auth token if it's correct");
	}
}
