@echo off
title Pubblicazione Aggiornamenti Viabilita 118 Ferrara
echo ======================================================
echo Pubblicazione versione 3.9.4 (Percorso rosa Giro dell'Emilia 2026 programmato) su Vercel / GitHub...
echo ======================================================
cd /d "c:\Users\acer\Desktop\viabilita 118"
git add .
git commit -m "v3.9.4 - Tracciamento percorso rosa Giro dell'Emilia 2026 e programmazione 3 Ottobre 2026"
git push origin main
echo ======================================================
echo PUBBLICAZIONE COMPLETATA CON SUCCESSO!
echo ======================================================
pause
