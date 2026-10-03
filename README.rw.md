# Omukuumi CLI

Omukuumi CLI ni umufasha wa AI mu kwandika kode ukoreshwa muri terminal, ushyira Ikinyarwanda imbere. Ifasha abanditsi ba porogaramu gusoma, guhindura, kwandika, no gukoresha kode hifashishijwe command line.

Urubuga: https://console.omukuumi.org

> Iyi README ishyira Ikinyarwanda imbere.  
> English documentation: [README.en.md](README.en.md)

## Icyo ikora

- Ifungura umufasha wa kode muri terminal ukoresheje `omukuumi`
- Isoma amadosiye ya poroje kandi igasobanura kode
- Ihindura cyangwa ikandika amadosiye iyo ubiyisabye
- Ikoresha shell commands ibinyujije mu gikoresho cya bash
- Ishyigikira providers na models zitandukanye za AI
- Ishyigikira ubumenyi, ingereko, prompt templates, na themes
- Igaragaza ubufasha bwa CLI n'amabwiriza ya `/` mu Kinyarwanda-first

## Igishushanyo cya terminal

```text
┌──────────────────────────────┐
│          Omukuumi CLI          │
│ Umufasha wa AI mu Kinyarwanda │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│ omukuumi                      │
│ Tangiza umufasha muri terminal│
└───────────────┬──────────────┘
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│  read   │ │  edit   │ │  bash   │
│ amadosiye││  kode   │ │ command │
└────┬────┘ └────┬────┘ └────┬────┘
     └──────────┼──────────┘
                ▼
┌──────────────────────────────┐
│ Andika impinduka, sobanura   │
│ kode, ukomeze ukorera local  │
└──────────────────────────────┘
```

## Ibisabwa

- Linux, macOS, cyangwa Windows terminal
- Node.js `>=22.19.0`
- npm
- Git
- Credential ya AI provider imwe ishyigikiwe, cyangwa kwinjira ukoresheje CLI

## Install kuri Linux / macOS

Koresha iyi command:

```bash
curl -fsSL https://console.omukuumi.org/install.sh | bash
```

Niba ushaka indi folder:

```bash
curl -fsSL https://console.omukuumi.org/install.sh | GIHANGA_INSTALL_DIR="$HOME/Tools/omukuumi-cli" bash
```

## Install kuri Windows

Koresha PowerShell:

```powershell
iwr https://console.omukuumi.org/install.ps1 -UseB | iex
```

Niba ushaka indi folder:

```powershell
$env:GIHANGA_INSTALL_DIR="$HOME\Tools\omukuumi-cli"; iwr https://console.omukuumi.org/install.ps1 -UseB | iex
```

Iyi installer ishyira cyangwa ivugurura Omukuumi CLI muri `~/.omukuumi-cli`, ikayubaka, hanyuma igahuza command `omukuumi` kuri uyu mukoresha.

Install inashyiramo ubumenyi bwa Omukuumi n'amagambo y'Ikinyarwanda muri `~/.omukuumi/agent`:

- `skills/omukuumi-community/SKILL.md`
- `data/kinyarwanda-keywords.json`

## Manual install

```bash
git clone https://github.com/DannyIRUMVA/omukuumi-command-line-interface.git
cd omukuumi-command-line-interface
npm install --ignore-scripts
npm run build
cd packages/coding-agent
npm link
omukuumi --help
```

Nyuma y'ibi, command `omukuumi` izajya ikora aho uri hose kuri mudasobwa yawe kuri uyu mukoresha.

## Kuvugurura local install

```bash
cd omukuumi-command-line-interface
git pull
npm install --ignore-scripts
npm run build
cd packages/coding-agent
npm link
omukuumi --version
```

## Imikoreshereze y'ibanze

```bash
# Tangira uburyo bw'ibiganiro
omukuumi

# Baza ikibazo kimwe hanyuma usohoke
omukuumi -p "Sobanura iyi poroje"

# Shyiramo dosiye mu butumwa bwa mbere
omukuumi @README.md "Vuga muri make iyi dosiye"

# Erekana ubufasha
omukuumi --help

# Erekana models zihari
omukuumi --list-models
```

## Amategeko akoreshwa cyane

```bash
omukuumi install <source>      # Injiza extension/package source
omukuumi remove <source>       # Kuramo extension/package source
omukuumi update                # Vugurura Omukuumi
omukuumi list                  # Erekana packages/extensions zinjijwe
omukuumi config                # Fungura igenamiterere rya package resources
```

Mu buryo bw'ibiganiro, andika `/` kugira ngo ubone slash commands nka:

```text
/settings
/model
/kwinjira
/continue
/new
/compact
/sohoka
```

## Kwinjira / Authentication

Ushobora gutangira Omukuumi hanyuma ugakoresha `/kwinjira`:

```bash
omukuumi
# hanyuma wandike: /kwinjira
```

Cyangwa ugashyiraho API key ukoresheje environment variables, urugero:

```bash
export ANTHROPIC_API_KEY="your-api-key"
omukuumi
```

Providers zishyigikiwe zirimo Anthropic, OpenAI, Google Gemini, GitHub Copilot, OpenRouter, Groq, Cerebras, Mistral, Amazon Bedrock, Cloudflare, n'izindi.

## Iterambere / Development

```bash
npm install --ignore-scripts
npm run build
npm run check
./omukuumi-test.sh
```

Kuri Windows development:

```powershell
.\omukuumi-test.ps1
```

## Icyitonderwa

- Command nyamukuru ni `omukuumi`.
- Command syntax nka `install` iguma mu Cyongereza kugira ngo copy-paste compatibility ikomeze, ariko help text n'inyandiko rusange bikoresha Ikinyarwanda-first.
- Uyu mushinga uhindurwa kugira ngo ufashe umuryango w'abanditsi ba porogaramu bakoresha Ikinyarwanda.

## License

MIT open source license. Ushobora gukoresha, gukoporora, guhindura, gusangiza, gutanga sublicense, no kugurisha kopi ukurikije ibiri muri [LICENSE](LICENSE).
