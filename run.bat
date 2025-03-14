@echo off
for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"


:: Initiate docker
echo %ESC%[0;31m[*] Initiating docker ... %ESC%[0m
docker-compose up -d
echo.