import { signIn as signInTrue, getTokenPopup } from './authPopup'
import { loginRequest, tokenRequest } from './authConfig';
import { APP_PREFIX, SUB_ID } from './constants';

export const signIn = async () => {
  signInTrue()
}

export const make_api_call = async (api, version, method = "GET", data = null, other_params = "", tokenType = tokenRequest, return_all_response = false) => {
  const tokens = await getTokenPopup(tokenType);

  if (tokens === undefined) {
    signIn()
    return
  }

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
  /** 
   * TODO: I could return the header if the response is 202
  */
  return return_all_response ?
    response :
    (response.headers.get("content-length") != 0 ? response.json() : null)
}

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
  make_api_call(`resourcegroups/${name}`, "2021-04-01", "DELETE", null, "&forceDeletionTypes=Microsoft.Compute/virtualMachines,Microsoft.Compute/virtualMachineScaleSets")

export const delete_all_resource_groups = async (prefix) => {
  if (!prefix)
    console.error("A prefix has to be specified")

  const all_resources = await list_resource_groups()

  return await Promise.all(all_resources.filter(({ name }) => name.startsWith(prefix)).map(({ name }) => delete_resource_group(name)))
}

export const create_virtual_network = async (name, resourceGroupName = name, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/${name}`, "2022-07-01", "PUT", {
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

export const create_subnet = async (name, resourceGroupName = name, virtualNetworkName = name) =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/${virtualNetworkName}/subnets/${name}`, "2022-07-01", "PUT", {
    properties: {
      addressPrefix: "10.0.0.0/24"
    }
  })

export const create_public_ip_address = async (name, resourceGroupName = name, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/publicIPAddresses/${name}`, "2022-07-01", "PUT", {
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

const get_public_ip_address = async (name, resourceGroupName = name) =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/publicIPAddresses/${name}`, "2022-07-01")

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const wait_for_ip_address = async (name, resourceGroupName = name) => {
  while (true) {
    const result = await get_public_ip_address(name, resourceGroupName)
    if (result.properties.ipAddress)
      return result
    await sleep(1000)
  }
}

export const create_network_security_group = async (name, resourceGroupName = name, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Network/networkSecurityGroups/${name}`, "2022-07-01", "PUT", {
    location: location,
    properties: {
      securityRules: [{
        name: "rdp rule",
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

export const create_virtual_machine = async (vmName, username, password, networkInterfaceId, resourceGroupName = vmName, location = "westeurope") =>
  make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}`, "2021-03-01", "PUT", {
    location: location,
    properties: {
      storageProfile: {
        imageReference: {
          //To correctly create a virtual machine I have to follow this https://learn.microsoft.com/en-us/azure/virtual-machines/windows/upload-generalized-managed?toc=%252fazure%252fvirtual-machines%252fwindows%252ftoc.json
          // https://learn.microsoft.com/en-us/azure/virtual-machines/windows/capture-image-resource
          //id: `/subscriptions/${SUB_ID}/resourceGroups/Managment-ExamsOnTheCloud/providers/Microsoft.Compute/images/ExamsVMWithSublime`
          publisher: "MicrosoftWindowsDesktop",
          offer: "Windows-10",
          sku: "win10-21h2-pro-g2",
          version: "latest"
        }
      },
      hardwareProfile: {
        vmSize: "Standard_DS1_v2"
      },
      osProfile: {
        computerName: "EXAM-PC",
        adminUsername: username,
        adminPassword: password
      },
      networkProfile: {
        networkInterfaces: [{
          id: networkInterfaceId
        }]
      }
    },
    tags: {
      cloudexams: "test"
    }
  })

export const create_user_in_vm = async (vmName, username, password, resourceGroupName = vmName) => {
  const resp = await make_api_call(`resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}/runCommand`, "2019-03-01", "POST", {
    commandId: "RunPowerShellScript",
    script: [
      //`Write-Output 'Hello, World!'`
      `New-LocalUser -Name '${username}' -Password (ConvertTo-SecureString '${password}' -AsPlainText -Force) -AccountNeverExpires -PasswordNeverExpires`,
      //`New-NetFirewallRule -DisplayName 'Allow RDP' -Direction Inbound -Protocol TCP -LocalPort 3389 -RemoteAddress Any -Action Allow -Program 'C:\Windows\System32\svchost.exe' -Service RemoteDesktop`,
      `Add-LocalGroupMember -Group 'Remote Desktop Users' -Member '${username}'`
    ]
  }, undefined, undefined, true)

  const tokens = await getTokenPopup(tokenRequest);

  const fetchUrl = resp.headers.get('azure-asyncOperation')
  while (true) {
    const result = await fetch(fetchUrl, { headers: { authorization: `Bearer ${tokens.accessToken}` } })
    if (result.status === "Succeeded")
      break
    await sleep(1000)
  }
}

export const send_email = async (to, subject, body) => {
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
          contentType: 'Text',
          content: body
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ]
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
  name += Math.floor(Math.random() * 1000)
  console.log(name)

  const tokens = await getTokenPopup(loginRequest);

  if (tokens === undefined) {
    console.error("User needs to login before creating docx")
    signIn()
    return false
  }

  var options = {
    method: 'PUT',
    headers: {
      'Authorization': "Bearer " + tokens.accessToken,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  };
  var graphEndpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/ExamsOnTheCloud/${name}.docx:/content`

  const response = await fetch(graphEndpoint, options)
  if (response.status !== 201) {
    console.error("there was some error creating the docx")
    console.log(response)
    return false
  } else {
    console.log("correctly created docx")
  }
  return true
}

export const grant_access_to_doc = async (name, email) => {
  const tokens = await getTokenPopup(loginRequest);

  if (tokens === undefined) {
    console.error("User needs to login before creating docx")
    signIn()
    return false
  }

  var options = {
    method: 'POST',
    headers: {
      'Authorization': "Bearer " + tokens.accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "requireSignIn": true,
      "sendInvitation": true,
      "roles": ["write"],
      "recipients": [
        {
          "email": email
        }
      ]
    })
  };
  var graphEndpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/ExamsOnTheCloud/LucaTest.docx:/invite`

  const response = await fetch(graphEndpoint, options)
  if (response.status !== 202) {
    console.error("there was some error creating the docx")
    console.log(response)
    return false
  } else {
    console.log("correctly created docx")
  }
  return true
} 

const replicated_workflow = async () => {
  const new_name = APP_PREFIX + Math.floor(Math.random() * 1000)

  console.log("deletign old resources")
  await delete_all_resource_groups(APP_PREFIX)

  console.log("creating rg " + new_name)
  await create_resource_groups(new_name)

  console.log("creating vn")
  await create_virtual_network(new_name)

  console.log("creating subnet")
  const subnet = await create_subnet(new_name)

  console.log("creating public ip")
  await create_public_ip_address(new_name)

  console.log("get ip addresss")
  const ipaddr = await wait_for_ip_address(new_name)
  console.log("New ip address is " + ipaddr.properties.ipAddress)

  console.log("creating security group")
  const netsecgrp = await create_network_security_group(new_name)

  console.log("creating network interface")
  const netint = await create_network_interface(new_name, netsecgrp.id, subnet.id, ipaddr.id)

  console.log("create virtual machine")
  await create_virtual_machine(
    new_name,
    "veryweirdusername",
    "V3ryC0m6mmple3.xPewo6rd", //this seems not to be changed 
    netint.id
  )

  console.log("create user/password")
  const commandRes = await create_user_in_vm(new_name, "luca", "th1sIsA32sda")
  console.log("Command result")
  //console.log(commandRes)
  /**
  xfreerdp /v:20.93.167.13 /u:veryweirdusername /p:V3ryC0m6mmple3.xPewo6rd
  xfreerdp /v:40.114.146.105 /u:luca /p:th1sIsA32sda
   */
  console.log("end")
}

export const testFunction = async () => {

  replicated_workflow()
}