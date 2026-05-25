# Installs PM2 as a Windows service so your Node.js app auto-starts on reboot.

Write-Host "Installing pm2-windows-startup globally..."
npm install pm2-windows-startup -g

Write-Host "Configuring PM2 to start on boot..."
pm2-startup install

Write-Host "Saving current PM2 process list..."
pm2 save

Write-Host "PM2 Windows startup installation complete."
Write-Host "Your PM2 processes will now auto-start on Windows boot."