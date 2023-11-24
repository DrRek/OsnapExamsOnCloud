import { signIn, getTokenPopup } from './authPopup'
import { dbTokenRequest, loginRequest, tokenRequest } from './authConfig';
import { APP_PREFIX, E_CREATE_USER_REQ, E_LOGS, E_STATUS_VALUES, SUB_ID } from './constants';
import moment from 'moment';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const get_token = async (tokenType) => {
  const tokens = await getTokenPopup(tokenType);
  if (tokens === undefined) {
    console.log("token not found, loggin in")
    await signIn()
    return await getTokenPopup(tokenType);
  }
  return tokens
}

const get_jsonable_response = async (response, expect_json=false) => ({
  headers: [...response.headers.entries()],
  body: expect_json ? await response.json() : await response.text(),
  status: response.status
})

export const make_api_call = async (api, version, method = "GET", data = null, other_params = "", tokenType = tokenRequest, return_all_response = false) => {
  const tokens = await get_token(tokenType)

  var options = {
    method: method,
    headers: {
      'Authorization': "Bearer " + tokens.accessToken,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : null
  };
  var graphEndpoint = `https://management.azure.com/subscriptions/${SUB_ID}/${api}?api-version=${version}${other_params}`

  const response = await fetch(graphEndpoint, options)

  if([429].includes(response.status)){
    console.log("Hitted some throttling, resting for 3 seconds")
    await sleep(3000)
    return make_api_call(api, version, method, data, other_params, tokenType, return_all_response)
  }

  /** 
   * TODO: I could return the header if the response is 202
  */
  return return_all_response ?
    await get_jsonable_response(response) :
    (response.headers.get("content-length") !== 0 && [200, 201].includes(response.status) ? response.json() : null)
} 

export const check_resource_group_existance = async name => {
  const resp = await make_api_call(`resourcegroups/${name}`, "2021-04-01", "HEAD", null, "", tokenRequest, true)
  if(resp.status === 204){
    console.log("resource group exists")
    return true
  } else if(resp.status === 404){
    console.log("resource group does not exists")
    return false
  } else {
    console.error("error while trying to understand the resource group status")
    console.log(`Resource group name fetched: ${name}`)
    return true
  }
}

export const get_resource_group_link = name =>
  `https://portal.azure.com/#@osnap.it/resource/subscriptions/${SUB_ID}/resourceGroups/${name}`

export const list_resource_groups = async () =>
  (await make_api_call("resourcegroups", "2021-04-01")).value

export const create_resource_groups = async (name, location = "westeurope") =>
  make_api_call(`resourcegroups/${name}`, "2021-04-01", "PUT", {
    location: location,
    tags: {
      cloudexams: "test"
    }
  })

export const delete_resource_group = async (name) =>
  make_api_call(`resourcegroups/${name}`, "2021-04-01", "DELETE", null, "&forceDeletionTypes=Microsoft.Compute/virtualMachines,Microsoft.Compute/virtualMachineScaleSets", tokenRequest, true)

export const delete_all_resource_groups = async (prefix) => {
  if (!prefix)
    console.error("A prefix has to be specified")

  const all_resources = await list_resource_groups()

  return await Promise.all(all_resources.filter(({ name }) => name.startsWith(prefix)).map(({ name }) => delete_resource_group(name)))
}

export const create_virtual_network = async (resourceGroupName, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/customVirtualNetwork`, "2022-07-01", "PUT", {
    location: location,
    properties: {
      addressSpace: {
        addressPrefixes: ["10.0.0.0/16"]
      },
    },
    tags: {
      cloudexams: "test"
    }
  })

export const create_subnet = async (resourceGroupName) =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/customVirtualNetwork/subnets/customSubnet`, "2022-07-01", "PUT", {
    properties: {
      addressPrefix: "10.0.0.0/24"
    }
  })

export const create_public_ip_address = async (resourceGroupName, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/publicIPAddresses/customPublicIP`, "2022-07-01", "PUT", {
    location: location,
    sku: {
      name: "Standard"
    },
    properties: {
      publicIPAllocationMethod: "Static",
      publicIPAddressVersion: "IPV4"
    },
    tags: {
      cloudexams: "test"
    }
  })

const get_public_ip_address = async (resourceGroupName) =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/publicIPAddresses/customPublicIP`, "2022-07-01")

export const wait_for_ip_address = async (resourceGroupName) => {
  while (true) {
    const result = await get_public_ip_address(resourceGroupName)
    if (result.properties.ipAddress)
      return result
    await sleep(1000)
  }
}

export const create_network_security_group = async (resourceGroupName, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/networkSecurityGroups/customSecurityGroup`, "2022-07-01", "PUT", {
    location: location,
    properties: {
      securityRules: [{
        name: "rdp_rule",
        properties: {
          protocol: "tcp",
          sourcePortRange: "*",
          sourceAddressPrefix: "*",
          destinationPortRange: "3389",
          destinationAddressPrefix: "*",
          direction: "inbound",
          access: "allow",
          priority: 200
        }
      }]
    },
    tags: {
      cloudexams: "test"
    }
  })

export const create_network_interface = async (name, networkSecurityGroupId, subnetId, publicIpAddressId, resourceGroupName = name, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/networkInterfaces/${name}`, "2022-07-01", "PUT", {
    location: location,
    properties: {
      ipConfigurations: [{
        name: name,
        properties: {
          subnet: {
            id: subnetId
          },
          publicIPAddress: {
            id: publicIpAddressId
          }
        }
      }],
      networkSecurityGroup: {
        id: networkSecurityGroupId
      }
    },
    tags: {
      cloudexams: "test"
    }
  })

export const create_network_interface_2 = async (name, subnetId, resourceGroupName = name, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/networkInterfaces/${name}`, "2022-07-01", "PUT", {
    location: location,
    properties: {
      ipConfigurations: [{
        name: name,
        properties: {
          subnet: {
            id: subnetId
          },
          privateIPAllocationMethod: "Dynamic"
        }
      }]
    },
    tags: {
      cloudexams: "test"
    }
  })

const VMNAME = 'customVirtualMachine'
export const create_virtual_machine = async (resourceGroupName, netInt1, instanceType = "Standard_D4s_v3", location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${VMNAME}`, "2021-03-01", "PUT", {
    location: location,
    properties: {
      storageProfile: {
        imageReference: {
          //To correctly create a virtual machine I have to follow this https://learn.microsoft.com/en-us/azure/virtual-machines/windows/upload-generalized-managed?toc=%252fazure%252fvirtual-machines%252fwindows%252ftoc.json
          // https://learn.microsoft.com/en-us/azure/virtual-machines/windows/capture-image-resource
          id: `/subscriptions/${SUB_ID}/resourceGroups/Managment-ExamsOnTheCloud/providers/Microsoft.Compute/galleries/ExamImageGallery/images/Revit_2023_1/versions/latest`
          //publisher: "MicrosoftWindowsDesktop",
          //offer: "Windows-10",
          //sku: "win10-21h2-pro-g2",
          //version: "latest"
        },
        osDisk: {
          createOption: "FromImage"
        }
      },
      hardwareProfile: {
        vmSize: instanceType
      },
      //osProfile: {
      //  computerName: "OSNAP-EXAM-VM",
      //  adminUsername: username,
      //  adminPassword: password
      //},
      networkProfile: {
        networkInterfaces: [{
          id: netInt1,
          properties: {
            primary: true
          }
        }]
      }
    },
    tags: {
      cloudexams: "test"
    }
  })

export const turn_on_virtual_machine = async (resourceGroupName, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${VMNAME}/start`, "2022-11-01", "POST", {})

export const turn_off_virtual_machine = async (resourceGroupName, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${VMNAME}/deallocate`, "2022-11-01", "POST", {})

export const check_virtual_machine = async (resourceGroupName, location = "westeurope") =>
  make_api_call(`/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${VMNAME}/instanceView`, "2022-11-01", "GET")

export const create_budget_alert = async (resourceGroupName, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Consumption/budgets/budget`, "2021-10-01", "PUT", {
    "eTag": "\"1d34d016a593709\"",
    "properties": {
      "category": "Cost",
      "amount": 1,
      "timeGrain": "Monthly",
      "timePeriod": {
        "startDate": `${moment().format("yyyy-MM")}-01T00:00:00Z`
      },
      "notifications": {
        "Actual_GreaterThan_80_Percent": {
          "enabled": true,
          "operator": "GreaterThan",
          "threshold": 80,
          "locale": "it-it",
          "contactEmails": [
            "lucareccia@hotmail.it"
          ],
          "thresholdType": "Actual"
        }
      }
    }
  })

export const change_vm_passwords = async (resourceGroupName, adminPw, studentPw, storageContainerName="testcontainername", storageContainerToken="expiredkeytoreplace") => {
  const resp = await make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/customVirtualMachine/runCommand`, "2019-03-01", "POST", {
    commandId: "RunPowerShellScript",
    script: [
      `net user studente ${studentPw}`,
      `net user osnap ${adminPw}`,
      `cmd.exe /C 'C:\\Windows\\System32\\chcp.com 65001 & echo @echo off > C:\\Users\\studente\\azcopy_windows_amd64_10.20.1\\syncer.bat'`,
      `cmd.exe /C 'C:\\Windows\\System32\\chcp.com 65001 & echo C:\\Users\\studente\\azcopy_windows_amd64_10.20.1\\azcopy.exe sync "C:\\Users\\studente\\Desktop" "https://osnapdbexamsonthecloud.blob.core.windows.net/${storageContainerName}?${storageContainerToken.replaceAll("%","%%")}" --delete-destination true >> C:\\Users\\studente\\azcopy_windows_amd64_10.20.1\\syncer.bat'`,
      `cmd.exe /C 'C:\\Windows\\System32\\chcp.com 65001 & echo move nul 2^>^&0 >> C:\\Users\\studente\\azcopy_windows_amd64_10.20.1\\syncer.bat'`,
      `schtasks /create /sc minute /mo 1 /tn "SyncDesktopToContainer" /tr "cmd.exe /C start /min C:\\Users\\studente\\azcopy_windows_amd64_10.20.1\\syncer.bat & exit" /st 00:00 /F /IT /ru "studente"`
      //'$MACAddress = "00-0D-3A-2F-BA-E0"',
      //'$NetAdapter = Get-NetAdapter -InterfaceDescription "*#2"',
      //'Set-NetAdapter $NetAdapter.Name -MacAddress $MACAddress -Confirm:$false',
      //`Write-Output 'Hello, World!'`
      //`New-LocalUser -Name '${username}' -Password (ConvertTo-SecureString '${password}' -AsPlainText -Force) -AccountNeverExpires -PasswordNeverExpires`,
      //`New-NetFirewallRule -DisplayName 'Allow RDP' -Direction Inbound -Protocol TCP -LocalPort 3389 -RemoteAddress Any -Action Allow -Program 'C:\Windows\System32\svchost.exe' -Service RemoteDesktop`,
      //`Add-LocalGroupMember -Group 'Remote Desktop Users' -Member '${username}'`
    ]
  }, undefined, undefined, true)
  return resp
}

export const check_create_user_in_vm = async (exam) => {
  try{
    const headers = exam[E_CREATE_USER_REQ].headers
    const location_header = headers.find(i => i[0] === "location")
    if(!location_header)
      return false
    const check_url = location_header[1]
  
    const tokens = await get_token(tokenRequest)
    var options = {
      method: "GET",
      headers: {
        'Authorization': "Bearer " + tokens.accessToken,
      },
    };
  
    const response = await fetch(check_url, options)
    return response.status === 202 ? 
      false :
      await get_jsonable_response(response)
  } catch (e){
    console.error("Error in check_create_user_in_VM")
    console.error(e)
    return false
  }
}

export const send_email = async (to, subject, body, attachments = []) => {
  const tokens = await getTokenPopup(loginRequest);

  if (tokens === undefined) {
    console.error("User needs to login before sending email")
    signIn()
    return false
  }

  var options = {
    method: 'POST',
    headers: {
      'Authorization': "Bearer " + tokens.accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        subject: subject,
        body: {
          contentType: 'html',
          content: body
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ],
        attachments: attachments
      },
      sveToSentItems: false
    })
  };
  var graphEndpoint = 'https://graph.microsoft.com/v1.0/me/sendMail'

  const response = await fetch(graphEndpoint, options)
  if (response.status !== 202) {
    console.error("there was some error sending the email")
    console.log(response)
    return false
  } else {
    console.log("correctly sent email")
  }
  return true
}

export const create_docx_document = async (name) => {
  name += `-${Math.floor(Math.random() * 1000)}`
  console.log(`create_docx_document with name: ${name}`)

  const tokens = await get_token(loginRequest)

  var options = {
    method: 'PUT',
    headers: {
      'Authorization': "Bearer " + tokens.accessToken,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  };
  var graphEndpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/ExamsOnTheCloud/${name}.docx:/content`

  const response = await fetch(graphEndpoint, options)
  return await get_jsonable_response(response, true)
}

export const grant_access_to_doc = async (name, email) => {
  const tokens = await get_token(loginRequest);

  var options = {
    method: 'POST',
    headers: {
      'Authorization': "Bearer " + tokens.accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "requireSignIn": true,
      "sendInvitation": false,
      "roles": ["write"],
      "recipients": [
        {
          "email": email
        }
      ]
    })
  };
  var graphEndpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/ExamsOnTheCloud/${name}:/invite`

  const response = await fetch(graphEndpoint, options)
  return await get_jsonable_response(response, true)
} 

export const remove_access_to_doc = async (name) => {
  const tokens = await get_token(loginRequest);

  const options = {
    method: 'GET',
    headers: {
      'Authorization': "Bearer " + tokens.accessToken
    }
  };
  const graphEndpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/ExamsOnTheCloud/${name}:/permissions`

  const response = await fetch(graphEndpoint, options)
  const jsonResponse = await response.json()
  for(const invitations of jsonResponse["value"]){
    const options2 = {
      method: 'DELETE',
      headers: {
        'Authorization': "Bearer " + tokens.accessToken
      }
    };
    var graphEndpoint2 = `https://graph.microsoft.com/v1.0/me/drive/root:/ExamsOnTheCloud/${name}:/permissions/${invitations.id}`

    await fetch(graphEndpoint2, options2)
  }
  return
}

export const create_storage_container = async (name) => {
  const resp = await make_api_call(`resourceGroups/Managment-ExamsOnTheCloud/providers/Microsoft.Storage/storageAccounts/osnapdbexamsonthecloud/blobServices/default/containers/${name}`, "2023-01-01", "PUT", {
    properties: {
      defaultEncryptionScope: "$account-encryption-key",
      denyEncryptionScopeOverride: false,
      metadata: {
        test: "test"
      }
    }
  }, undefined, undefined, false)
  return resp
}

export const create_storage_container_sas = async (name) => 
  make_api_call(`resourceGroups/Managment-ExamsOnTheCloud/providers/Microsoft.Storage/storageAccounts/osnapdbexamsonthecloud/listServiceSas`, "2023-01-01", "POST", {
    canonicalizedResource: `/blob/osnapdbexamsonthecloud/${name}`,
    signedExpiry: moment().add(120, 'days').toISOString(),
    signedPermission: "racwdl",
    signedProtocol: "https",
    signedResource: "c"
  }, undefined, undefined, false)

export const testFunction = async () => {

}

const DB_NAME = "exams"

export const db_list_exams = async () => {
  const raw_exams = JSON.parse(localStorage.getItem(DB_NAME) || "{}")
  return Object.keys(raw_exams).map(key => raw_exams[key])
}

export const db_is_prefix_unique = async (newID) => {
  const exams = await db_list_exams()
  return !exams.some(({id}) => id.startsWith(newID))
}

export const db_update_exam = (exam, reason) => {
  console.log("db_update_exam for reason: "+reason)
  console.log(exam)
  exam[E_LOGS].push({
    "timestamp": Date.now()/1000,
    "reason": reason
  })
  const raw_exams = JSON.parse(localStorage.getItem(DB_NAME) || "{}")
  localStorage.setItem(DB_NAME, JSON.stringify({
    ...raw_exams,
    [exam.id]: exam
  }))
}

const db_util_obj_to_json = obj => {
  let newObj = {};

  for (const key in obj) {
    if (Array.isArray(obj[key]) || typeof obj[key] === 'object') {
      newObj[key] = JSON.stringify(obj[key]);
    } else {
      newObj[key] = obj[key];
    }
  }

  return newObj;
}

const db_util_json_to_obj = obj => {
  let newObj = {};

  for (const key in obj) {
    try {
      newObj[key] = JSON.parse(obj[key]);
    } catch (e) {
      newObj[key] = obj[key];
    }
  }

  return newObj;
}

const DB_URL = "https://osnapdbexamsonthecloud.table.core.windows.net/exams"

export const db_list_exams_v2 = async () => {
  const tokens = await get_token(dbTokenRequest)

  const headers = new Headers({
    'Authorization': `Bearer ${tokens.accessToken}`,
    'Accept': 'application/json',
    'x-ms-version': '2019-02-02'
  });

  const options = {
    method: 'GET',
    headers: headers
  }

  const resp = await fetch(DB_URL, options)
  return (await resp.json()).value.map(i => db_util_json_to_obj(i))
}

export const db_list_active_exams_v2 = async () => {
  const tokens = await get_token(dbTokenRequest)

  const headers = new Headers({
    'Authorization': `Bearer ${tokens.accessToken}`,
    'Accept': 'application/json',
    'x-ms-version': '2019-02-02'
  });

  const options = {
    method: 'GET',
    headers: headers
  }

  //boundary date set to 7 days ago
  const boundary_date = new Date();
  boundary_date.setDate(boundary_date.getDate() - 7);

  const resp = await fetch(`${DB_URL}()?$filter=Timestamp ge datetime'${boundary_date.toISOString()}' or status ne '${E_STATUS_VALUES.DESTROYED}'`, options)
  return (await resp.json()).value.map(i => db_util_json_to_obj(i))
}

export const db_is_prefix_unique_v2 = async (newID) => {
  const tokens = await get_token(dbTokenRequest)

  const headers = new Headers({
    'Authorization': `Bearer ${tokens.accessToken}`,
    'Accept': 'application/json',
    'x-ms-version': '2019-02-02'
  });

  const options = {
    method: 'GET',
    headers: headers
  }

  const resp = await fetch(`${DB_URL}()?$filter=RowKey ge '${newID}' and RowKey lt '${newID}z'`, options)
  const objects = (await resp.json()).value
  return objects.length === 0 ? true : false
}

export const db_update_exam_v2 = async (exam, reason) => {
  console.log("db_update_exam_v2 for reason: "+reason)
  const tokens = await get_token(dbTokenRequest)

  exam[E_LOGS].push({
    "timestamp": Date.now()/1000,
    "reason": reason
  })

  const options = {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Accept': 'application/json',
      'x-ms-version': '2019-02-02',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(db_util_obj_to_json(exam))
  }

  const resp = await fetch(`${DB_URL}(PartitionKey='Osnap',RowKey='${exam.id}')`, options)
}

export const db_delete_exam_v2 = async (exam) => {
  console.log("db_delete_exam_v2")
  const tokens = await get_token(dbTokenRequest)

  const options = {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Accept': 'application/json',
      'x-ms-version': '2019-02-02',
      'x-ms-date': new Date().toUTCString(),
      'If-Match': '*'
    }
  }

  const resp = await fetch(`${DB_URL}(PartitionKey='Osnap',RowKey='${exam.id}')`, options)
}