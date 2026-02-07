
$body = @{ email = "admin@campus.edu"; password = "admin123" } | ConvertTo-Json
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "TOKEN_CAPTURED:$token"

    # Now fetch complaints to find the one we seeded
    $complaints = Invoke-RestMethod -Uri "http://localhost:5000/api/complaints/admin" -Method Get -Headers @{ Authorization = "Bearer $token" }
    
    # Find the 'Projector Blurry' complaint
    $targetComplaint = $complaints | Where-Object { $_.title -eq "Projector Blurry" -and $_.status -eq "reported" }
    
    if ($targetComplaint) {
        $complaintId = $targetComplaint.id
        Write-Host "COMPLAINT_ID:$complaintId"
        
        # Now APPROVE it
        $approvalBody = @{ action = "accept"; notes = "Manual test approval via script" } | ConvertTo-Json
        $approveResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/complaints/$complaintId/approval" -Method Post -Body $approvalBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
        
        Write-Host "APPROVAL_RESPONSE_STATUS:$($approveResponse.status)"
        Write-Host "APPROVAL_RESPONSE_TECH:$($approveResponse.technicianId)"
    } else {
        Write-Host "No 'Projector Blurry' complaint found in REPORTED status."
    }

} catch {
    Write-Host "Error: $_"
}
