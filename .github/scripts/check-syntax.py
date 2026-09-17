#!/usr/bin/env python3
"""
Vérifie la syntaxe JS de tous les fichiers du repo :
- fichiers .js directement
- blocs <script>...</script> à l'intérieur des fichiers .html

Utilisé par .github/workflows/validate.yml — s'exécute automatiquement
à chaque commit. Si une erreur est trouvée, le script s'arrête avec un
code d'erreur, ce qui affiche une croix rouge sur GitHub.
"""
import re
import subprocess
import sys
import tempfile
import os
from pathlib import Path

erreurs = []

def verifier_js(code, origine):
    """Passe le code JS à `node --check` (via un fichier temporaire) et rapporte une éventuelle erreur."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(code)
        chemin_tmp = f.name
    try:
        result = subprocess.run(
            ["node", "--check", chemin_tmp],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            erreurs.append((origine, result.stderr.strip()))
    finally:
        os.unlink(chemin_tmp)

def traiter_fichier_js(chemin):
    code = chemin.read_text(encoding="utf-8", errors="replace")
    verifier_js(code, str(chemin))

def traiter_fichier_html(chemin):
    contenu = chemin.read_text(encoding="utf-8", errors="replace")
    blocs = re.findall(r"<script\b(?![^>]*\bsrc=)[^>]*>(.*?)</script>", contenu, re.S | re.I)
    for i, bloc in enumerate(blocs):
        if bloc.strip():
            verifier_js(bloc, f"{chemin} (bloc <script> #{i+1})")

# Dossiers à ignorer (dépendances, historique git, etc.)
IGNORE = {".git", "node_modules", ".github"}

racine = Path(".")
for chemin in racine.rglob("*"):
    if any(part in IGNORE for part in chemin.parts):
        continue
    if chemin.suffix == ".js":
        traiter_fichier_js(chemin)
    elif chemin.suffix == ".html":
        traiter_fichier_html(chemin)

if erreurs:
    print(f"\n❌ {len(erreurs)} erreur(s) de syntaxe JS détectée(s) :\n")
    for origine, message in erreurs:
        print(f"--- {origine} ---")
        print(message)
        print()
    sys.exit(1)
else:
    print("✅ Aucune erreur de syntaxe JS détectée.")
    sys.exit(0)
