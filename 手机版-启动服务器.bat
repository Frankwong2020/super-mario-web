@echo off
chcp 65001 >nul
title 超级小红帽 - 手机游玩服务器
cd /d "%~dp0"
echo ==================================================
echo            超级小红帽 - 手机游玩服务器
echo ==================================================
echo.
echo  第一步: 确保手机和电脑连接 同一个 Wi-Fi
echo.
echo  第二步: 用手机浏览器打开下面的地址（任选其一）:
echo.
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | ForEach-Object { Write-Host ('      http://' + $_.IPAddress + ':18080') -ForegroundColor Green }"
echo.
echo  提示: 横屏游玩体验最佳；首次启动如弹出
echo        Windows 防火墙提示，请点击【允许访问】
echo.
echo  关闭此窗口即停止服务器
echo ==================================================
echo.
python -m http.server 18080 --bind 0.0.0.0
pause
