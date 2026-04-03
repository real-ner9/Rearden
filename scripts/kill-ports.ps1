$ports = @(3000, 3001)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $processIds = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $processIds) {
            if ($procId -ne 0) {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "Killing $($proc.ProcessName) (PID $procId) on port $port"
                    Stop-Process -Id $procId -Force
                }
            }
        }
    }
}
Write-Host "Ports 3000 and 3001 are free"
