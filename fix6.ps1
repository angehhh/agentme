$files = Get-ChildItem -Path app, lib -Recurse -Include *.ts, *.tsx
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $content = $content.Replace([char]0xC3 + [char]0x83 + [char]0x97, "x")
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Output "OK $($file.Name)"
}
