
$body = @{ email = "admin@campus.edu"; password = "admin123" } | ConvertTo-Json
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    $token = $loginResponse.token
    
    # Fetch all complaints to verify status
    $complaints = Invoke-RestMethod -Uri "http://localhost:5000/api/complaints/admin" -Method Get -Headers @{ Authorization = "Bearer $token" }
    $targetComplaint = $complaints | Where-Object { $_.title -eq "Projector Blurry" }
    
    Write-Host "CURRENT_STATUS:$($targetComplaint.status)"
    Write-Host "ASSIGNED_TECH:$($targetComplaint.technicianId)"
    
    # Also Check Asset Status
    # We can infer it from the complaint object if it includes asset, or fetch asset directly if we had an endpoint
    Write-Host "ASSET_STATUS:$($targetComplaint.asset.status)"

} catch {
    Write-Host "Error: $_"
}
