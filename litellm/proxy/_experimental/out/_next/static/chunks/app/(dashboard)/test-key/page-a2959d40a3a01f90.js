(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2461],{8952:(e,t,i)=>{Promise.resolve().then(i.bind(i,17885))},17885:(e,t,i)=>{"use strict";i.r(t),i.d(t,{default:()=>p});var a=i(95155),o=i(47583),r=i(42696),n=i(12115),s=i(27428);let p=()=>{let{token:e,accessToken:t,userRole:i,userId:p,disabledPersonalKeyCreation:l}=(0,r.A)(),[m,u]=(0,n.useState)(void 0);return(0,n.useEffect)(()=>{(async()=>{if(t){let e=await (0,s.g)(t);e&&u({PROXY_BASE_URL:e.PROXY_BASE_URL||void 0,LITELLM_UI_API_DOC_BASE_URL:e.LITELLM_UI_API_DOC_BASE_URL})}})()},[t]),(0,a.jsx)(o.A,{accessToken:t,token:e,userRole:i,userID:p,disabledPersonalKeyCreation:l,proxySettings:m})}},21796:(e,t,i)=>{"use strict";i.d(t,{E:()=>a.A});var a=i(75892)},22603:(e,t,i)=>{"use strict";i.d(t,{Q:()=>o});var a=i(28436);let o=async e=>{try{let t=await (0,a.modelHubCall)(e);if(console.log("model_info:",t),t?.data.length>0){let e=t.data.map(e=>({model_group:e.model_group,mode:e?.mode}));return e.sort((e,t)=>e.model_group.localeCompare(t.model_group)),e}return[]}catch(e){throw console.error("Error fetching model info:",e),e}}},27428:(e,t,i)=>{"use strict";i.d(t,{g:()=>o});var a=i(28436);let o=async e=>{if(!e)return null;try{return await (0,a.getProxyUISettings)(e)}catch(e){return console.error("Error fetching proxy settings:",e),null}}},36690:(e,t,i)=>{"use strict";i.d(t,{sx:()=>n,yz:()=>p});var a,o,r=((a={}).AUDIO_SPEECH="audio_speech",a.AUDIO_TRANSCRIPTION="audio_transcription",a.IMAGE_GENERATION="image_generation",a.VIDEO_GENERATION="video_generation",a.CHAT="chat",a.RESPONSES="responses",a.IMAGE_EDITS="image_edits",a.ANTHROPIC_MESSAGES="anthropic_messages",a.EMBEDDING="embedding",a),n=((o={}).IMAGE="image",o.VIDEO="video",o.CHAT="chat",o.RESPONSES="responses",o.IMAGE_EDITS="image_edits",o.ANTHROPIC_MESSAGES="anthropic_messages",o.EMBEDDINGS="embeddings",o.SPEECH="speech",o.TRANSCRIPTION="transcription",o.A2A_AGENTS="a2a_agents",o.MCP="mcp",o);let s={image_generation:"image",video_generation:"video",chat:"chat",responses:"responses",image_edits:"image_edits",anthropic_messages:"anthropic_messages",audio_speech:"speech",audio_transcription:"transcription",embedding:"embeddings"},p=e=>{if(console.log("getEndpointType:",e),Object.values(r).includes(e)){let t=s[e];return console.log("endpointType:",t),t}return"chat"}},39771:(e,t,i)=>{"use strict";i.d(t,{O:()=>o});var a=i(36690);let o=e=>{let t,{apiKeySource:i,accessToken:o,apiKey:r,inputMessage:n,chatHistory:s,selectedTags:p,selectedVectorStores:l,selectedGuardrails:m,selectedPolicies:u,selectedMCPServers:d,mcpServers:_,mcpServerToolRestrictions:g,selectedVoice:c,endpointType:f,selectedModel:h,selectedSdk:b,proxySettings:y}=e,x="session"===i?o:r,E=window.location.origin,I=y?.LITELLM_UI_API_DOC_BASE_URL;I&&I.trim()?E=I:y?.PROXY_BASE_URL&&(E=y.PROXY_BASE_URL);let w=n||"Your prompt here",v=w.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n"),S=s.filter(e=>!e.isImage).map(({role:e,content:t})=>({role:e,content:t})),A={};p.length>0&&(A.tags=p),l.length>0&&(A.vector_stores=l),m.length>0&&(A.guardrails=m),u.length>0&&(A.policies=u);let $=h||"your-model-name",O="azure"===b?`import openai

client = openai.AzureOpenAI(
	api_key="${x||"YOUR_LITELLM_API_KEY"}",
	azure_endpoint="${E}",
	api_version="2024-02-01"
)`:`import openai

client = openai.OpenAI(
	api_key="${x||"YOUR_LITELLM_API_KEY"}",
	base_url="${E}"
)`;switch(f){case a.sx.CHAT:{let e=Object.keys(A).length>0,i="";if(e){let e=JSON.stringify({metadata:A},null,2).split("\n").map(e=>" ".repeat(4)+e).join("\n").trim();i=`,
    extra_body=${e}`}let a=S.length>0?S:[{role:"user",content:w}];t=`
import base64

# Helper function to encode images to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Example with text only
response = client.chat.completions.create(
    model="${$}",
    messages=${JSON.stringify(a,null,4)}${i}
)

print(response)

# Example with image or PDF (uncomment and provide file path to use)
# base64_file = encode_image("path/to/your/file.jpg")  # or .pdf
# response_with_file = client.chat.completions.create(
#     model="${$}",
#     messages=[
#         {
#             "role": "user",
#             "content": [
#                 {
#                     "type": "text",
#                     "text": "${v}"
#                 },
#                 {
#                     "type": "image_url",
#                     "image_url": {
#                         "url": f"data:image/jpeg;base64,{base64_file}"  # or data:application/pdf;base64,{base64_file}
#                     }
#                 }
#             ]
#         }
#     ]${i}
# )
# print(response_with_file)
`;break}case a.sx.RESPONSES:{let e=Object.keys(A).length>0,i="";if(e){let e=JSON.stringify({metadata:A},null,2).split("\n").map(e=>" ".repeat(4)+e).join("\n").trim();i=`,
    extra_body=${e}`}let a=S.length>0?S:[{role:"user",content:w}];t=`
import base64

# Helper function to encode images to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Example with text only
response = client.responses.create(
    model="${$}",
    input=${JSON.stringify(a,null,4)}${i}
)

print(response.output_text)

# Example with image or PDF (uncomment and provide file path to use)
# base64_file = encode_image("path/to/your/file.jpg")  # or .pdf
# response_with_file = client.responses.create(
#     model="${$}",
#     input=[
#         {
#             "role": "user",
#             "content": [
#                 {"type": "input_text", "text": "${v}"},
#                 {
#                     "type": "input_image",
#                     "image_url": f"data:image/jpeg;base64,{base64_file}",  # or data:application/pdf;base64,{base64_file}
#                 },
#             ],
#         }
#     ]${i}
# )
# print(response_with_file.output_text)
`;break}case a.sx.IMAGE:t="azure"===b?`
# NOTE: The Azure SDK does not have a direct equivalent to the multi-modal 'responses.create' method shown for OpenAI.
# This snippet uses 'client.images.generate' and will create a new image based on your prompt.
# It does not use the uploaded image, as 'client.images.generate' does not support image inputs in this context.
import os
import requests
import json
import time
from PIL import Image

result = client.images.generate(
	model="${$}",
	prompt="${n}",
	n=1
)

json_response = json.loads(result.model_dump_json())

# Set the directory for the stored image
image_dir = os.path.join(os.curdir, 'images')

# If the directory doesn't exist, create it
if not os.path.isdir(image_dir):
	os.mkdir(image_dir)

# Initialize the image path
image_filename = f"generated_image_{int(time.time())}.png"
image_path = os.path.join(image_dir, image_filename)

try:
	# Retrieve the generated image
	if json_response.get("data") && len(json_response["data"]) > 0 && json_response["data"][0].get("url"):
			image_url = json_response["data"][0]["url"]
			generated_image = requests.get(image_url).content
			with open(image_path, "wb") as image_file:
					image_file.write(generated_image)

			print(f"Image saved to {image_path}")
			# Display the image
			image = Image.open(image_path)
			image.show()
	else:
			print("Could not find image URL in response.")
			print("Full response:", json_response)
except Exception as e:
	print(f"An error occurred: {e}")
	print("Full response:", json_response)
`:`
import base64
import os
import time
import json
from PIL import Image
import requests

# Helper function to encode images to base64
def encode_image(image_path):
	with open(image_path, "rb") as image_file:
			return base64.b64encode(image_file.read()).decode('utf-8')

# Helper function to create a file (simplified for this example)
def create_file(image_path):
	# In a real implementation, this would upload the file to OpenAI
	# For this example, we'll just return a placeholder ID
	return f"file_{os.path.basename(image_path).replace('.', '_')}"

# The prompt entered by the user
prompt = "${v}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${$}",
	input=[
			{
					"role": "user",
					"content": [
							{"type": "input_text", "text": prompt},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image1}",
							},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image2}",
							},
							{
									"type": "input_image",
									"file_id": file_id1,
							},
							{
									"type": "input_image",
									"file_id": file_id2,
							}
					],
			}
	],
	tools=[{"type": "image_generation"}],
)

# Process the response
image_generation_calls = [
	output
	for output in response.output
	if output.type == "image_generation_call"
]

image_data = [output.result for output in image_generation_calls]

if image_data:
	image_base64 = image_data[0]
	image_filename = f"edited_image_{int(time.time())}.png"
	with open(image_filename, "wb") as f:
			f.write(base64.b64decode(image_base64))
	print(f"Image saved to {image_filename}")
else:
	# If no image is generated, there might be a text response with an explanation
	text_response = [output.text for output in response.output if hasattr(output, 'text')]
	if text_response:
			print("No image generated. Model response:")
			print("\\n".join(text_response))
	else:
			print("No image data found in response.")
	print("Full response for debugging:")
	print(response)
`;break;case a.sx.IMAGE_EDITS:t="azure"===b?`
import base64
import os
import time
import json
from PIL import Image
import requests

# Helper function to encode images to base64
def encode_image(image_path):
	with open(image_path, "rb") as image_file:
			return base64.b64encode(image_file.read()).decode('utf-8')

# The prompt entered by the user
prompt = "${v}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${$}",
	input=[
			{
					"role": "user",
					"content": [
							{"type": "input_text", "text": prompt},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image1}",
							},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image2}",
							},
							{
									"type": "input_image",
									"file_id": file_id1,
							},
							{
									"type": "input_image",
									"file_id": file_id2,
							}
					],
			}
	],
	tools=[{"type": "image_generation"}],
)

# Process the response
image_generation_calls = [
	output
	for output in response.output
	if output.type == "image_generation_call"
]

image_data = [output.result for output in image_generation_calls]

if image_data:
	image_base64 = image_data[0]
	image_filename = f"edited_image_{int(time.time())}.png"
	with open(image_filename, "wb") as f:
			f.write(base64.b64decode(image_base64))
	print(f"Image saved to {image_filename}")
else:
	# If no image is generated, there might be a text response with an explanation
	text_response = [output.text for output in response.output if hasattr(output, 'text')]
	if text_response:
			print("No image generated. Model response:")
			print("\\n".join(text_response))
	else:
			print("No image data found in response.")
	print("Full response for debugging:")
	print(response)
`:`
import base64
import os
import time

# Helper function to encode images to base64
def encode_image(image_path):
	with open(image_path, "rb") as image_file:
			return base64.b64encode(image_file.read()).decode('utf-8')

# Helper function to create a file (simplified for this example)
def create_file(image_path):
	# In a real implementation, this would upload the file to OpenAI
	# For this example, we'll just return a placeholder ID
	return f"file_{os.path.basename(image_path).replace('.', '_')}"

# The prompt entered by the user
prompt = "${v}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${$}",
	input=[
			{
					"role": "user",
					"content": [
							{"type": "input_text", "text": prompt},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image1}",
							},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image2}",
							},
							{
									"type": "input_image",
									"file_id": file_id1,
							},
							{
									"type": "input_image",
									"file_id": file_id2,
							}
					],
			}
	],
	tools=[{"type": "image_generation"}],
)

# Process the response
image_generation_calls = [
	output
	for output in response.output
	if output.type == "image_generation_call"
]

image_data = [output.result for output in image_generation_calls]

if image_data:
	image_base64 = image_data[0]
	image_filename = f"edited_image_{int(time.time())}.png"
	with open(image_filename, "wb") as f:
			f.write(base64.b64decode(image_base64))
	print(f"Image saved to {image_filename}")
else:
	# If no image is generated, there might be a text response with an explanation
	text_response = [output.text for output in response.output if hasattr(output, 'text')]
	if text_response:
			print("No image generated. Model response:")
			print("\\n".join(text_response))
	else:
			print("No image data found in response.")
	print("Full response for debugging:")
	print(response)
`;break;case a.sx.EMBEDDINGS:t=`
response = client.embeddings.create(
	input="${n||"Your string here"}",
	model="${$}",
	encoding_format="base64" # or "float"
)

print(response.data[0].embedding)
`;break;case a.sx.TRANSCRIPTION:t=`
# Open the audio file
audio_file = open("path/to/your/audio/file.mp3", "rb")

# Make the transcription request
response = client.audio.transcriptions.create(
	model="${$}",
	file=audio_file${n?`,
	prompt="${n.replace(/"/g,'\\"')}"`:""}
)

print(response.text)
`;break;case a.sx.SPEECH:t=`
# Make the text-to-speech request
response = client.audio.speech.create(
	model="${$}",
	input="${n||"Your text to convert to speech here"}",
	voice="${c}"  # Options: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer
)

# Save the audio to a file
output_filename = "output_speech.mp3"
response.stream_to_file(output_filename)
print(f"Audio saved to {output_filename}")

# Optional: Customize response format and speed
# response = client.audio.speech.create(
#     model="${$}",
#     input="${n||"Your text to convert to speech here"}",
#     voice="alloy",
#     response_format="mp3",  # Options: mp3, opus, aac, flac, wav, pcm
#     speed=1.0  # Range: 0.25 to 4.0
# )
# response.stream_to_file("output_speech.mp3")
`;break;default:t="\n# Code generation for this endpoint is not implemented yet."}return`${O}
${t}`}},42696:(e,t,i)=>{"use strict";i.d(t,{A:()=>l});var a=i(28436),o=i(12352),r=i(97035),n=i(73321),s=i(12115),p=i(64394);let l=()=>{let e=(0,n.useRouter)(),{data:t,isLoading:i}=(0,p._)(),l="u">typeof document?(0,o.R)("token"):null,m=(0,s.useMemo)(()=>(0,r.oL)(l),[l]),u=(0,s.useMemo)(()=>(0,r.eP)(l),[l])&&!t?.admin_ui_disabled;return(0,s.useEffect)(()=>{!i&&(u||(l&&(0,o.E)(),e.replace(`${(0,a.getProxyBaseUrl)()}/ui/login`)))},[i,u,l,e]),{isLoading:i,isAuthorized:u,token:u?l:null,accessToken:m?.key??null,userId:m?.user_id??null,userEmail:m?.user_email??null,userRole:function(e){if(!e)return"Undefined Role";switch(e.toLowerCase()){case"app_owner":case"demo_app_owner":return"App Owner";case"app_admin":case"proxy_admin":return"Admin";case"proxy_admin_viewer":return"Admin Viewer";case"org_admin":return"Org Admin";case"internal_user":return"Internal User";case"internal_user_viewer":case"internal_viewer":return"Internal Viewer";case"app_user":return"App User";default:return"Unknown Role"}}(m?.user_role),premiumUser:m?.premium_user??null,disabledPersonalKeyCreation:m?.disabled_non_admin_personal_key_creation??null,showSSOBanner:m?.login_method==="username_password"}}},66927:(e,t,i)=>{"use strict";i.d(t,{A:()=>s});var a=i(95155),o=i(12115),r=i(23060),n=i(28436);let s=({onChange:e,value:t,className:i,accessToken:s,placeholder:p="Select vector stores",disabled:l=!1})=>{let[m,u]=(0,o.useState)([]),[d,_]=(0,o.useState)(!1);return(0,o.useEffect)(()=>{(async()=>{if(s){_(!0);try{let e=await (0,n.vectorStoreListCall)(s);e.data&&u(e.data)}catch(e){console.error("Error fetching vector stores:",e)}finally{_(!1)}}})()},[s]),(0,a.jsx)("div",{children:(0,a.jsx)(r.A,{mode:"multiple",placeholder:p,onChange:e,value:t,loading:d,className:i,allowClear:!0,options:m.map(e=>({label:`${e.vector_store_name||e.vector_store_id} (${e.vector_store_id})`,value:e.vector_store_id,title:e.vector_store_description||e.vector_store_id})),optionFilterProp:"label",showSearch:!0,style:{width:"100%"},disabled:l})})}},68462:(e,t,i)=>{"use strict";i.d(t,{Ay:()=>s});var a=i(95155),o=i(12115),r=i(23060),n=i(28436);let s=({onChange:e,value:t,className:i,accessToken:s,disabled:p,onPoliciesLoaded:l})=>{let[m,u]=(0,o.useState)([]),[d,_]=(0,o.useState)(!1);return(0,o.useEffect)(()=>{(async()=>{if(s){_(!0);try{let e=await (0,n.getPoliciesList)(s);e.policies&&(u(e.policies),l?.(e.policies))}catch(e){console.error("Error fetching policies:",e)}finally{_(!1)}}})()},[s,l]),(0,a.jsx)("div",{children:(0,a.jsx)(r.A,{mode:"multiple",disabled:p,placeholder:p?"Setting policies is a premium feature.":"Select policies (production or published versions)",onChange:t=>{e(t)},value:t,loading:d,className:i,allowClear:!0,options:m.filter(e=>(e.version_status??"draft")!=="draft").map(e=>{var t;let i=e.version_number??1,a=e.version_status??"draft";return{label:`${e.policy_name} — v${i} (${a})${e.description?` — ${e.description}`:""}`,value:"production"===a?e.policy_name:e.policy_id?(t=e.policy_id,`policy_${t}`):e.policy_name}}),optionFilterProp:"label",showSearch:!0,style:{width:"100%"}})})}},87433:(e,t,i)=>{"use strict";i.d(t,{A:()=>s});var a=i(95155),o=i(12115),r=i(23060),n=i(28436);let s=({onChange:e,value:t,className:i,accessToken:s,disabled:p})=>{let[l,m]=(0,o.useState)([]),[u,d]=(0,o.useState)(!1);return(0,o.useEffect)(()=>{(async()=>{if(s){d(!0);try{let e=await (0,n.getGuardrailsList)(s);console.log("Guardrails response:",e),e.guardrails&&(console.log("Guardrails data:",e.guardrails),m(e.guardrails))}catch(e){console.error("Error fetching guardrails:",e)}finally{d(!1)}}})()},[s]),(0,a.jsx)("div",{children:(0,a.jsx)(r.A,{mode:"multiple",disabled:p,placeholder:p?"Setting guardrails is a premium feature.":"Select guardrails",onChange:t=>{console.log("Selected guardrails:",t),e(t)},value:t,loading:u,className:i,allowClear:!0,options:l.map(e=>(console.log("Mapping guardrail:",e),{label:`${e.guardrail_name}`,value:e.guardrail_name})),optionFilterProp:"label",showSearch:!0,style:{width:"100%"}})})}},97035:(e,t,i)=>{"use strict";i.d(t,{eP:()=>n,oL:()=>r,xP:()=>o});var a=i(19253);function o(e){try{let t=(0,a.s)(e);if(t&&"number"==typeof t.exp)return 1e3*t.exp<=Date.now();return!1}catch{return!0}}function r(e){if(!e)return null;try{return(0,a.s)(e)}catch{return null}}function n(e){return!!e&&null!==r(e)&&!o(e)}}},e=>{e.O(0,[3725,5884,1145,1909,1326,8536,8267,5049,9791,3138,2823,7397,4135,639,9285,3079,9750,8517,4394,3847,7583,8441,3794,7358],()=>e(e.s=8952)),_N_E=e.O()}]);