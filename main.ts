import {
	App,
	Component,
	Editor, getIcon,
	MarkdownRenderer,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting
} from 'obsidian';


// $arg
const ARG_PATTERN = /\$(\d+)/g
// - macro{arg1, arg2, ...}
// - macro{}
const MACRO_PATTERN = /^(\w+){([^}]*)}$/
// For splitting on args. hello, world -> ["hello", "world"]
const PASSED_ARGS_PATTERN = /,\s+/

interface Replacement {
	name: string
	args: number
	replacement: string
}

// the loadData doesn't make them classes anymore (just plain objects) and typescript doesn't detect that.
// So I use functions instead which more or less are just methods

/**
 * Replaces args inside replacement and returns the new string
 * @param args Args to use. Position corresponds to arg number
 */
function run(r: Replacement, args: string[]): string {
	let result = r.replacement;
	for (let i = 0; i < r.args; ++i) {
		result = result.replaceAll(`$${i}`, args[i])
	}
	return result;
}

/**
 * Parses a replacement string and updates current args and replacement.
 * @param text Text to parse. Finds arguments in this
 */
function parseArgs(replacement: Replacement, text: string) {
	const args = [...text.matchAll(ARG_PATTERN)]
	// TODO: Check if user skipped a number
	replacement.args = args.length;
	replacement.replacement = text;
}

interface Settings {
	replacements: Replacement[]
}

const DEFAULT_SETTINGS: Settings = {
	replacements: []
}

export default class SimpleMacros extends Plugin {
	settings: Settings
	// Lookup table to make searching faster. name -> replacement
	lookup: Record<string, Replacement>

	async onload() {
		// Load in settings
		await this.loadSettings();
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// Register processor
		// Replaces `{name(args)}` with a matching template (Does nothing if nothing matches
		this.registerMarkdownPostProcessor((element, context) => {
			console.log("Running processor")
			console.dir(element)
			element.querySelectorAll("code").forEach(elem => {
				const text = elem.textContent || ""
				// Get arguments from text
				const match = text.match(MACRO_PATTERN)
				if (match && match[1] in this.lookup) {
					element.replaceWith()
					const args = match[2].split(PASSED_ARGS_PATTERN)
					const replacement = this.lookup[match[1]]
					const newText = run(replacement, args)
					const newElem = createDiv()
					// @ts-ignore
					MarkdownRenderer.renderMarkdown(newText, newElem, context.sourcePath, null)
					// We first need to get the markdown out of the div. And then get the actual content
					// out of the <p>
					elem.replaceWith(newElem.children[0].children[0])
				}
			})
		});
	}


	onunload() {

	}

	/**
	 * Updates lookup table with value in settings
	 */
	updateLookup() {
		if (!this.lookup) this.lookup = {}
		this.settings.replacements.map(r => this.lookup[r.name] = r)
		console.dir(this.lookup)
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.updateLookup()
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateLookup()
	}
}


class SampleSettingTab extends PluginSettingTab {
	plugin: SimpleMacros;

	constructor(app: App, plugin: SimpleMacros) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		const settings = new Setting(containerEl)
		this.plugin.settings.replacements.map(r => {
			const replacementSetting = new Setting(containerEl)
			replacementSetting
				.addText(txt => txt
						.setValue(r.name)
				.setPlaceholder("Name of macro")
					.onChange(async (value) => {
						r.name = value
						await this.plugin.saveSettings()
					})
				)
				.addText(txt => txt
					.setValue(r.replacement)
					.setPlaceholder("Replacement string")
					.onChange(async (value) => {
						parseArgs(r, value)
						await this.plugin.saveSettings()
					}))
				.addButton(btn => btn
					.setIcon("trash")
					.onClick(async () => {
						this.plugin.settings.replacements.remove(r)
						await this.plugin.saveSettings()
						await this.display()
					})
				)
		})
		settings.addButton(btn => btn
			.setButtonText("Add")
			.onClick(async () => {
				this.plugin.settings.replacements.push({name: "", replacement: "", args: 0} as Replacement)
				await this.display()
			})
		)
	}
}
