# Omukuumi CLI

Omukuumi CLI buli AI coding assistant wa terminal eyo eva Omulimi olungereza/Luganda. Ennyonyola abateekateekate okusoma, okukyusa, okwandiika, n'okukola code w'oluganda ku command line mu maaso g'okulinda endereera eno ey'omusaayi wa coding agent.

Eddwaliro: https://omukuumi.co

Ekiwanulidde Genesis Codeworks Ltd.

## Kiki ekyokola

- Eyitula terminal coding assistant wawulidde ku `omukuumi`
- Asoma ebifaananyi by'ekibuga n'okubigamba
- Akususula n'okwandiika ebifaananyi lwe wo wabuuza
- Akola shell commands mu bash tool eyo ebuwa mu nnyo
- Atambulira AI providers n'amodelo mengi
- Atambulira skills, extensions, prompt templates, n'emigga
- Amanyi CLI help n'ebigambo bya slash-command mu Olungereza/Luganda

## Ebintu ebyetagisa

- Linux, macOS, kana Windows terminal
- Node.js `>=22.19.0`
- npm
- Git
- Olwekiwo olulwekiwo lwa AI provider, kana okulogina mu CLI

## Okulaga ku Linux / macOS

```bash
curl -fsSL https://omukuumi.co/install.sh | bash
```

Akaseera okulaga:

```bash
curl -fsSL https://omukuumi.co/install.sh | OMUKUUMI_INSTALL_DIR="$HOME/Tools/omukuumi-cli" bash
```

## Okulaga ku Windows PowerShell

```powershell
iwr https://omukuumi.co/install.ps1 -UseB | iex
```

Akaseera okulaga:

```powershell
$env:OMUKUUMI_INSTALL_DIR="$HOME\Tools\omukuumi-cli"; iwr https://omukuumi.co/install.ps1 -UseB | iex
```

Ekiseera ekitule kijja n'okusasula kana okusasulira Omukuumi CLI mu `~/.omukuumi-cli`, ekiyise, n'ekiyita `omukuumi` command w'omutte w'olunaku.

Ekiseera ekitule kinnyonyola Omukuumi skills pack mu `~/.omukuumi/agent`:

- `skills/omukuumi-community/SKILL.md`
- `data/keywords.json`

## Okulaga nga kalina

```bash
git clone https://github.com/omukuumi/omukuumi-cli.git
cd omukuumi-cli
npm install --ignore-scripts
npm run build
cd packages/coding-agent
npm link
omukuumi --help
```

## Okukola ne kisa

```bash
# Okutandika interactive mode
omukuumi

# Okubuza ensonga eno n'okusoka
omukuumi -p "Gamba ekiwuusa eki"

# Okungamu ebifaananyi mu magezi gawo
omukuumi @README.md "Gamba ekiwuusa ekiwuusa eki"

# Okulaba help
omukuumi --help

# Okulaba emodelo ezitulidde
omukuumi --list-models
```

## Ebibuuzo eby'obutaka

```bash
omukuumi install <source>      # Okulaga ekisindikizo/ekisindikizo ekikulu
omukuumi remove <source>       # Okususa ekisindikizo/ekisindikizo ekikulu
omukuumi update                # Okusasulira Omukuumi
omukuumi list                  # Okulonda ebikulidde ebipakeji/extensions
omukuumi config                # Okulaba ekiwandiikidde eky'ekibuga
```

Mu interactive mode, yingira `/` okulaba slash commands ebyo:

```text
/settings
/model
/kwinjira
/continue
/new
/compact
/sohoka
```

## Okulogina

Olinga okutandika Omukuumi n'okukozesa `/kwinjira`:

```bash
omukuumi
# kale yingira: /kwinjira
```

Nsobola okuleeta API key mu environment variables bwe:

```bash
export ANTHROPIC_API_KEY="your-api-key"
omukuumi
```

Abateekateekate abatambulidde babalaba Anthropic, OpenAI, Google Gemini, GitHub Copilot, OpenRouter, Groq, Cerebras, Mistral, Amazon Bedrock, Cloudflare, n'abalala.

## Okuteekateeka

```bash
npm install --ignore-scripts
npm run build
npm run check
./omukuumi-test.sh
```

Windows development:

```powershell
.\omukuumi-test.ps1
```

## Ebibooboobo

- Erinnya ly'amagambo lye `omukuumi`.
- Command flags ziva mu Olungereza okweyongeera compatibility, naye help text ye English/Luganda-first.
- Ekiwuusa eki kyetaagisibwa Uganda/East Africa developer community.
- Ekiwanulidde Genesis Codeworks Ltd.

## License

MIT open source license. Osobola okukozesa, okukopera, okukyusa, okugabanya, okulonda, n'okuguliza ebikopi mu maaso ga maagiro ga [LICENSE](LICENSE).
