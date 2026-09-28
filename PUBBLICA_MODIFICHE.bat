@echo off
title Pubblicazione Aggiornamenti Viabilita 118 Ferrara
echo ======================================================
echo Pubblicazione versione 3.9.3 (Ripristino versione 3.9.3) su Vercel / GitHub...
echo ======================================================
cd /d "c:\Users\acer\Desktop\viabilita 118"
git add .
git commit -m "Ripristino versione 3.9.3"
git push origin main
echo ======================================================
echo PUBBLICAZIONE COMPLETATA CON SUCCESSO!
echo ======================================================
pause
