$files = Get-ChildItem -Path app, lib -Recurse -Include *.ts, *.tsx
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $content = $content -replace ([char]0xC3 + [char]0x97), ([char]0xD7)
    $content = $content -replace ([char]0xE2 + [char]0x80 + [char]0xA6), ([char]0x2026)
    $content = $content -replace ([char]0xE2 + [char]0x86 + [char]0x92), ([char]0x2192)
    $content = $content -replace ([char]0xC2 + [char]0xAB), ([char]0xAB)
    $content = $content -replace ([char]0xC2 + [char]0xBB), ([char]0xBB)
    $content = $content -replace ([char]0xC2 + [char]0xB7), ([char]0xB7)
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Output "OK $($file.Name)"
}
