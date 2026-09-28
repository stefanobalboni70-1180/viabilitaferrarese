@echo off
title Pubblicazione Aggiornamenti Viabilita 118 Ferrara
echo ======================================================
echo Pubblicazione versione 3.9.2 su Vercel in corso...
echo ======================================================
cd /d "c:\Users\acer\Desktop\viabilita 118"
git add .
git commit -m "Riduci dimensioni icona eliporto e cornice azzurra v3.9.2"
git push origin main
echo ======================================================
echo PUBBLICAZIONE COMPLETATA CON SUCCESSO!
echo ======================================================
pause
