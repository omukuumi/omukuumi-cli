}
	}
	time("parseArgs");

	if (parsed.version) {
		console.log(VERSION);
		process.exit(0);
	}

	if (parsed.browserInstall) {
		const { installBrowserTools } = await import("./core/browser-tools.ts");
		const result = await installBrowserTools();
		console.log(result.message);
		process.exit(result.success ? 0 : 1);
	}

	if (parsed.browserOpen) {
		const { createBrowserTools } = await import("./core/browser-tools.ts");
		const tools = createBrowserTools(process.cwd());
		const openTool = tools.find((t) => t.name === "browser_open");
		if (!openTool) {
			console.error(chalk.red("Browser tools unavailable. Run 'omukuumi browser install' to install browser dependencies."));
			process.exit(1);
		}
		const summary = await openTool.execute("cli", { url: parsed.browserUrl }, undefined, undefined, {
			ui: { setWidget() {} },
		});
		console.log(summary);
		process.exit(0);
	}

	if (parsed.browserCloseCmd) {
		const { createBrowserTools } = await import("./core/browser-tools.ts");
		const tools = createBrowserTools(process.cwd());
		const closeTool = tools.find((t) => t.name === "browser_close");
		if (!closeTool) {
			console.error(chalk.red("Browser tools unavailable. Run 'omukuumi browser install' to install browser dependencies."));
			process.exit(1);
		}
		const result = await closeTool.execute("cli", {}, undefined, undefined, { ui: { setWidget() {} } });
		console.log(result);
		process.exit(0);
	}

	if (parsed.browserSnapshot) {
		const { createBrowserTools } = await import("./core/browser-tools.ts");
		const tools = createBrowserTools(process.cwd());
		const snapshotTool = tools.find((t) => t.name === "browser_snapshot");
		if (!snapshotTool) {
			console.error(chalk.red("Browser tools unavailable. Run 'omukuumi browser install' to install browser dependencies."));
			process.exit(1);
		}
		const snapshot = await snapshotTool.execute("cli", {}, undefined, undefined, {
			ui: { setWidget() {} },
		});
		console.log(snapshot);
		process.exit(0);
	}

	if (parsed.browserClick) {
		const { createBrowserTools } = await import("./core/browser-tools.ts");
		const tools = createBrowserTools(process.cwd());
		const clickTool = tools.find((t) => t.name === "browser_click");
		if (!clickTool) {
			console.error(chalk.red("Browser tools unavailable. Run 'omukuumi browser install' to install browser dependencies."));
			process.exit(1);
		}
		const result = await clickTool.execute("cli", { target: parsed.browserTarget }, undefined, undefined, {
			ui: { setWidget() {} },
		});
		console.log(result);
		process.exit(0);
	}

	if (parsed.browserType) {
		const { createBrowserTools } = await import("./core/browser-tools.ts");
		const tools = createBrowserTools(process.cwd());
		const typeTool = tools.find((t) => t.name === "browser_type");
		if (!typeTool) {
			console.error(chalk.red("Browser tools unavailable. Run 'omukuumi browser install' to install browser dependencies."));
			process.exit(1);
		}
		const result = await typeTool.execute("cli", { target: parsed.browserTarget, text: parsed.browserText }, undefined, undefined, {
			ui: { setWidget() {} },
		});
		console.log(result);
		process.exit(0);
	}

	if (parsed.browserScroll) {
		const { createBrowserTools } = await import("./core/browser-tools.ts");
		const tools = createBrowserTools(process.cwd());
		const scrollTool = tools.find((t) => t.name === "browser_scroll");
		if (!scrollTool) {
			console.error(chalk.red("Browser tools unavailable. Run 'omukuumi browser install' to install browser dependencies."));
			process.exit(1);
		}
		const result = await scrollTool.execute("cli", { direction: parsed.browserDirection, amount: parsed.browserAmount }, undefined, undefined, {
			ui: { setWidget() {} },
		});
		console.log(result);
		process.exit(0);
	}

	if (parsed.browserBack) {
		const { createBrowserTools } = await import("./core/browser-tools.ts");
		const tools = createBrowserTools(process.cwd());
		const backTool = tools.find((t) => t.name === "browser_back");
		if (!backTool) {
			console.error(chalk.red("Browser tools unavailable. Run 'omukuumi browser install' to install browser dependencies."));
			process.exit(1);
		}
		const result = await backTool.execute("cli", {}, undefined, undefined, { ui: { setWidget() {} } });
		console.log(result);
		process.exit(0);
	}

	if (parsed.browserScreenshot) {
		const { createBrowserTools } = await import("./core/browser-tools.ts");
		const tools = createBrowserTools(process.cwd());
		const screenshotTool = tools.find((t) => t.name === "browser_screenshot");
		if (!screenshotTool) {
			console.error(chalk.red("Browser tools unavailable. Run 'omukuumi browser install' to install browser dependencies."));
			process.exit(1);
		}
		const result = await screenshotTool.execute("cli", {}, undefined, undefined, { ui: { setWidget() {} } });
		console.log(result);
		process.exit(0);
	}

	if (parsed.browserCloseCmd) {
		const { createBrowserTools } = await import("./core/browser-tools.ts");
		const tools = createBrowserTools(process.cwd());
		const closeTool = tools.find((t) => t.name === "browser_close");
		if (!closeTool) {
			console.error(chalk.red("Browser tools unavailable. Run 'omukuumi browser install' to install browser dependencies."));
			process.exit(1);
		}
		const result = await closeTool.execute("cli", {}, undefined, undefined, { ui: { setWidget() {} } });
		console.log(result);
		process.exit(0);
	}

	if (parsed.export) {