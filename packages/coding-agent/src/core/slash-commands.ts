import { APP_NAME } from "../config.ts";
import type { SourceInfo } from "./source-info.ts";

export type SlashCommandSource = "extension" | "prompt" | "skill";

export interface SlashCommandInfo {
	name: string;
	description?: string;
	source: SlashCommandSource;
	sourceInfo: SourceInfo;
}

export interface BuiltinSlashCommand {
	name: string;
	description: string;
	argumentHint?: string;
}

export const BUILTIN_SLASH_COMMANDS: ReadonlyArray<BuiltinSlashCommand> = [
	{ name: "settings", description: "Fungura menu y'igenamiterere" },
	{ name: "model", description: "Kwetaga model (yafungula selector UI)", argumentHint: "<provider/model>" },
	{ name: "scoped-models", description: "Tegeera cyangwa uganze emitegerezo eyo changenya na Ctrl+P" },
	{ name: "export", description: "Ggula ikiganiro (HTML ni default, cyangwa tanga path: .html/.jsonl)" },
	{ name: "import", description: "Yingiza kandi ukomeze ikiganiro kiva mu dosiye ya JSONL" },
	{ name: "share", description: "Gaga ikiganiro nka GitHub gist y'ibanga" },
	{ name: "copy", description: "Kopera ubutumwa bwa nyuma bw'assistant muri clipboard" },
	{ name: "name", description: "Gena izina ry'ikiganiro rigaragara" },
	{ name: "session", description: "Laba amakuru n'imibare by'ikiganiro" },
	{ name: "changelog", description: "Laba ebyahindutse mu changelog" },
	{ name: "hotkeys", description: "Laba shortcuts zose za keyboard" },
	{ name: "fork", description: "Bika fork nshya uhereye ku butumwa bw'umukoresha bwabanje" },
	{ name: "clone", description: "Kopera ikiganiro kiriho aho kigeze ubu" },
	{ name: "tree", description: "Yenda mu giti cy'ikiganiro (hindura amashami)" },
	{ name: "trust", description: "Tegeera icyemezo cyo kwizera poroje ku biganiro bizaza" },
	{ name: "login", description: "Tegura authentication ya provider", argumentHint: "<provider>" },
	{
		name: "org",
		description: "Reba cyangwa wongere organisation code ya Genesis Codeworks Ltd",
		argumentHint: "status|add|remove",
	},
	{ name: "doctor", description: "Suzuma installation, auth, models, na backend" },
	{ name: "logout", description: "Sula authentication ya provider" },
	{ name: "new", description: "Yambula ikiganiro gishya" },
	{ name: "compact", description: "Gadaganya context y'ikiganiro ukoresheje compact" },
	{ name: "continue", description: "Komeza ikiganiro" },
	{
		name: "reload",
		description: "Ongeza wulule keybindings, ingereko, skills, prompts, themes, na context files",
	},
	{ name: "sohoka", description: `Sohoka muri ${APP_NAME}` },
];
