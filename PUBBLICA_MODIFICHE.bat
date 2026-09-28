@echo off
title Pubblicazione Aggiornamenti Viabilita 118 Ferrara
echo ======================================================
echo Pubblicazione versione 3.9.3 (Dimensioni v3.7) su Vercel...
echo ======================================================
cd /d "c:\Users\acer\Desktop\viabilita 118"
git add .
git commit -m "Ripristina dimensioni icone come in versione 3.7 e cornice azzurra (v3.9.3)"
git push origin main
echo ======================================================
echo PUBBLICAZIONE COMPLETATA CON SUCCESSO!
echo ======================================================
pause
