@echo off
title Pubblicazione Aggiornamenti Viabilita 118 Ferrara
echo ======================================================
echo Pubblicazione versione 3.9.4 (Pulsante Elisoccorso e Header v3.9.4) su Vercel...
echo ======================================================
cd /d "c:\Users\acer\Desktop\viabilita 118"
git add .
git commit -m "Aggiungi pulsante toggle elisoccorso, sposta versione sotto Ferrara e aggiorna a v3.9.4"
git push origin main
echo ======================================================
echo PUBBLICAZIONE COMPLETATA CON SUCCESSO!
echo ======================================================
pause
