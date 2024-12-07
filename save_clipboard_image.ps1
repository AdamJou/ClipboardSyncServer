Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# Sprawdź, czy w schowku jest obraz
if ([System.Windows.Clipboard]::ContainsImage()) {
    $image = [System.Windows.Clipboard]::GetImage()
    $filePath = "$env:TEMP\clipboard_image.bmp"

    # Zapisz obraz jako BMP
    $fileStream = [System.IO.File]::Open($filePath, [System.IO.FileMode]::Create)
    $bitmapEncoder = New-Object Windows.Media.Imaging.BmpBitmapEncoder
    $bitmapEncoder.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($image))
    $bitmapEncoder.Save($fileStream)
    $fileStream.Close()

    Write-Output $filePath
} else {
    Write-Output "No image in clipboard"
}
