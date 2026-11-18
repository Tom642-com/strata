@echo off
chcp 65001 >nul
cd /d %~dp0
echo 正在启动本地预览，稍等几秒...
echo 打开浏览器访问：http://127.0.0.1:5173/
echo 关闭窗口或按 Ctrl+C 即可停止服务。
echo.
call npm run dev -- --host 127.0.0.1
pause
