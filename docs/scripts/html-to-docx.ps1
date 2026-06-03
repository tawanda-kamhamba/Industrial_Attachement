$html = Join-Path $PSScriptRoot '..\CAPSTONE_Chapters_4_to_6_Word.html'
$docx = Join-Path $PSScriptRoot '..\CAPSTONE_Chapters_4_to_6_Word.docx'
$word = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Open((Resolve-Path $html).Path)
    $format = 16  # wdFormatXMLDocument (.docx)
    $doc.SaveAs2($docx, $format)
    $doc.Close()
    $word.Quit()
    Write-Host "Created: $docx"
} catch {
    Write-Host "Could not create DOCX (Word may not be installed): $($_.Exception.Message)"
    exit 1
} finally {
    if ($word) {
        [void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($word)
    }
}
