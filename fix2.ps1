$files = Get-ChildItem -Path app, lib -Recurse -Include *.ts, *.tsx
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $content = $content -replace ([char]0xC3 + [char]0xAD), ([char]0xED)
    $content = $content -replace ([char]0xC3 + [char]0xB3), ([char]0xF3)
    $content = $content -replace ([char]0xC3 + [char]0xB1), ([char]0xF1)
    $content = $content -replace ([char]0xC3 + [char]0xA1), ([char]0xE1)
    $content = $content -replace ([char]0xC3 + [char]0xA9), ([char]0xE9)
    $content = $content -replace ([char]0xC3 + [char]0xBA), ([char]0xFA)
    $content = $content -replace ([char]0xC3 + [char]0xBC), ([char]0xFC)
    $content = $content -replace ([char]0xC3 + [char]0x93), ([char]0xD3)
    $content = $content -replace ([char]0xC3 + [char]0x89), ([char]0xC9)
    $content = $content -replace ([char]0xC3 + [char]0x91), ([char]0xD1)
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Output "OK $($file.Name)"
}
