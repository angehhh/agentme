$files = Get-ChildItem -Path app, lib -Recurse -Include *.ts, *.tsx
foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $result = New-Object System.Collections.Generic.List[byte]
    $i = 0
    while ($i -lt $bytes.Length) {
        if ($i -le $bytes.Length - 5 -and $bytes[$i] -eq 195 -and $bytes[$i+1] -eq 131 -and $bytes[$i+2] -eq 226 -and $bytes[$i+3] -eq 128 -and $bytes[$i+4] -eq 148) {
            $result.Add([byte]120)
            $i += 5
        } else {
            $result.Add($bytes[$i])
            $i++
        }
    }
    [System.IO.File]::WriteAllBytes($file.FullName, $result.ToArray())
    Write-Output "OK $($file.Name)"
}
