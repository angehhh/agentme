$files = Get-ChildItem -Path app, lib -Recurse -Include *.ts, *.tsx
foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $result = New-Object System.Collections.Generic.List[byte]
    $i = 0
    while ($i -lt $bytes.Length) {
        if ($i -lt $bytes.Length - 2 -and $bytes[$i] -eq 195 -and $bytes[$i+1] -eq 131 -and $bytes[$i+2] -eq 151) {
            $result.Add([byte]120)
            $i += 3
        } else {
            $result.Add($bytes[$i])
            $i++
        }
    }
    [System.IO.File]::WriteAllBytes($file.FullName, $result.ToArray())
    Write-Output "OK $($file.Name)"
}
