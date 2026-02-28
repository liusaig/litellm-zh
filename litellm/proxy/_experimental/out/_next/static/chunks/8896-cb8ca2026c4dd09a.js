"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8896],{5266:(e,t,s)=>{s.d(t,{AP:()=>l,_S:()=>i,mD:()=>r,sc:()=>n,xE:()=>a});let a="local-storage-change";function r(e){window.dispatchEvent(new CustomEvent(a,{detail:{key:e}}))}function i(e){try{return window.localStorage.getItem(e)}catch(t){return console.warn(`Error reading localStorage key "${e}":`,t),null}}function l(e,t){try{window.localStorage.setItem(e,t)}catch(t){console.warn(`Error setting localStorage key "${e}":`,t)}}function n(e){try{window.localStorage.removeItem(e)}catch(t){console.warn(`Error removing localStorage key "${e}":`,t)}}},13755:(e,t,s)=>{s.d(t,{e:()=>n});var a=s(5266),r=s(12115);function i(e){let t=t=>{"disableUsageIndicator"===t.key&&e()},s=t=>{let{key:s}=t.detail;"disableUsageIndicator"===s&&e()};return window.addEventListener("storage",t),window.addEventListener(a.xE,s),()=>{window.removeEventListener("storage",t),window.removeEventListener(a.xE,s)}}function l(){return"true"===(0,a._S)("disableUsageIndicator")}function n(){return(0,r.useSyncExternalStore)(i,l)}},19041:(e,t,s)=>{s.d(t,{y:()=>n});var a=s(12115),r=s(5266);function i(e){let t=t=>{"disableShowPrompts"===t.key&&e()},s=t=>{let{key:s}=t.detail;"disableShowPrompts"===s&&e()};return window.addEventListener("storage",t),window.addEventListener(r.xE,s),()=>{window.removeEventListener("storage",t),window.removeEventListener(r.xE,s)}}function l(){return"true"===(0,r._S)("disableShowPrompts")}function n(){return(0,a.useSyncExternalStore)(i,l)}},27428:(e,t,s)=>{s.d(t,{g:()=>r});var a=s(28436);let r=async e=>{if(!e)return null;try{return await (0,a.getProxyUISettings)(e)}catch(e){return console.error("Error fetching proxy settings:",e),null}}},36690:(e,t,s)=>{s.d(t,{sx:()=>l,yz:()=>o});var a,r,i=((a={}).AUDIO_SPEECH="audio_speech",a.AUDIO_TRANSCRIPTION="audio_transcription",a.IMAGE_GENERATION="image_generation",a.VIDEO_GENERATION="video_generation",a.CHAT="chat",a.RESPONSES="responses",a.IMAGE_EDITS="image_edits",a.ANTHROPIC_MESSAGES="anthropic_messages",a.EMBEDDING="embedding",a),l=((r={}).IMAGE="image",r.VIDEO="video",r.CHAT="chat",r.RESPONSES="responses",r.IMAGE_EDITS="image_edits",r.ANTHROPIC_MESSAGES="anthropic_messages",r.EMBEDDINGS="embeddings",r.SPEECH="speech",r.TRANSCRIPTION="transcription",r.A2A_AGENTS="a2a_agents",r.MCP="mcp",r);let n={image_generation:"image",video_generation:"video",chat:"chat",responses:"responses",image_edits:"image_edits",anthropic_messages:"anthropic_messages",audio_speech:"speech",audio_transcription:"transcription",embedding:"embeddings"},o=e=>{if(console.log("getEndpointType:",e),Object.values(i).includes(e)){let t=n[e];return console.log("endpointType:",t),t}return"chat"}},39771:(e,t,s)=>{s.d(t,{O:()=>r});var a=s(36690);let r=e=>{let t,{apiKeySource:s,accessToken:r,apiKey:i,inputMessage:l,chatHistory:n,selectedTags:o,selectedVectorStores:c,selectedGuardrails:d,selectedPolicies:m,selectedMCPServers:p,mcpServers:u,mcpServerToolRestrictions:g,selectedVoice:h,endpointType:x,selectedModel:_,selectedSdk:f,proxySettings:b}=e,j="session"===s?r:i,A=window.location.origin,y=b?.LITELLM_UI_API_DOC_BASE_URL;y&&y.trim()?A=y:b?.PROXY_BASE_URL&&(A=b.PROXY_BASE_URL);let v=l||"Your prompt here",N=v.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n"),w=n.filter(e=>!e.isImage).map(({role:e,content:t})=>({role:e,content:t})),S={};o.length>0&&(S.tags=o),c.length>0&&(S.vector_stores=c),d.length>0&&(S.guardrails=d),m.length>0&&(S.policies=m);let I=_||"your-model-name",C="azure"===f?`import openai

client = openai.AzureOpenAI(
	api_key="${j||"YOUR_LITELLM_API_KEY"}",
	azure_endpoint="${A}",
	api_version="2024-02-01"
)`:`import openai

client = openai.OpenAI(
	api_key="${j||"YOUR_LITELLM_API_KEY"}",
	base_url="${A}"
)`;switch(x){case a.sx.CHAT:{let e=Object.keys(S).length>0,s="";if(e){let e=JSON.stringify({metadata:S},null,2).split("\n").map(e=>" ".repeat(4)+e).join("\n").trim();s=`,
    extra_body=${e}`}let a=w.length>0?w:[{role:"user",content:v}];t=`
import base64

# Helper function to encode images to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Example with text only
response = client.chat.completions.create(
    model="${I}",
    messages=${JSON.stringify(a,null,4)}${s}
)

print(response)

# Example with image or PDF (uncomment and provide file path to use)
# base64_file = encode_image("path/to/your/file.jpg")  # or .pdf
# response_with_file = client.chat.completions.create(
#     model="${I}",
#     messages=[
#         {
#             "role": "user",
#             "content": [
#                 {
#                     "type": "text",
#                     "text": "${N}"
#                 },
#                 {
#                     "type": "image_url",
#                     "image_url": {
#                         "url": f"data:image/jpeg;base64,{base64_file}"  # or data:application/pdf;base64,{base64_file}
#                     }
#                 }
#             ]
#         }
#     ]${s}
# )
# print(response_with_file)
`;break}case a.sx.RESPONSES:{let e=Object.keys(S).length>0,s="";if(e){let e=JSON.stringify({metadata:S},null,2).split("\n").map(e=>" ".repeat(4)+e).join("\n").trim();s=`,
    extra_body=${e}`}let a=w.length>0?w:[{role:"user",content:v}];t=`
import base64

# Helper function to encode images to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Example with text only
response = client.responses.create(
    model="${I}",
    input=${JSON.stringify(a,null,4)}${s}
)

print(response.output_text)

# Example with image or PDF (uncomment and provide file path to use)
# base64_file = encode_image("path/to/your/file.jpg")  # or .pdf
# response_with_file = client.responses.create(
#     model="${I}",
#     input=[
#         {
#             "role": "user",
#             "content": [
#                 {"type": "input_text", "text": "${N}"},
#                 {
#                     "type": "input_image",
#                     "image_url": f"data:image/jpeg;base64,{base64_file}",  # or data:application/pdf;base64,{base64_file}
#                 },
#             ],
#         }
#     ]${s}
# )
# print(response_with_file.output_text)
`;break}case a.sx.IMAGE:t="azure"===f?`
# NOTE: The Azure SDK does not have a direct equivalent to the multi-modal 'responses.create' method shown for OpenAI.
# This snippet uses 'client.images.generate' and will create a new image based on your prompt.
# It does not use the uploaded image, as 'client.images.generate' does not support image inputs in this context.
import os
import requests
import json
import time
from PIL import Image

result = client.images.generate(
	model="${I}",
	prompt="${l}",
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
prompt = "${N}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${I}",
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
`;break;case a.sx.IMAGE_EDITS:t="azure"===f?`
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
prompt = "${N}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${I}",
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
prompt = "${N}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${I}",
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
	input="${l||"Your string here"}",
	model="${I}",
	encoding_format="base64" # or "float"
)

print(response.data[0].embedding)
`;break;case a.sx.TRANSCRIPTION:t=`
# Open the audio file
audio_file = open("path/to/your/audio/file.mp3", "rb")

# Make the transcription request
response = client.audio.transcriptions.create(
	model="${I}",
	file=audio_file${l?`,
	prompt="${l.replace(/"/g,'\\"')}"`:""}
)

print(response.text)
`;break;case a.sx.SPEECH:t=`
# Make the text-to-speech request
response = client.audio.speech.create(
	model="${I}",
	input="${l||"Your text to convert to speech here"}",
	voice="${h}"  # Options: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer
)

# Save the audio to a file
output_filename = "output_speech.mp3"
response.stream_to_file(output_filename)
print(f"Audio saved to {output_filename}")

# Optional: Customize response format and speed
# response = client.audio.speech.create(
#     model="${I}",
#     input="${l||"Your text to convert to speech here"}",
#     voice="alloy",
#     response_format="mp3",  # Options: mp3, opus, aac, flac, wav, pcm
#     speed=1.0  # Range: 0.25 to 4.0
# )
# response.stream_to_file("output_speech.mp3")
`;break;default:t="\n# Code generation for this endpoint is not implemented yet."}return`${C}
${t}`}},48617:(e,t,s)=>{s.d(t,{k:()=>m});var a=s(95155),r=s(37621),i=s(3134),l=s(12115),n=s(48658),o=s(14992),c=s(17293),d=s(73946);function m({data:e=[],columns:t,isLoading:s=!1,defaultSorting:m=[],pagination:p,onPaginationChange:u,enablePagination:g=!1}){let[h,x]=l.useState(m),[_]=l.useState("onChange"),[f,b]=l.useState({}),[j,A]=l.useState({}),y=(0,r.N4)({data:e,columns:t,state:{sorting:h,columnSizing:f,columnVisibility:j,...g&&p?{pagination:p}:{}},columnResizeMode:_,onSortingChange:x,onColumnSizingChange:b,onColumnVisibilityChange:A,...g&&u?{onPaginationChange:u}:{},getCoreRowModel:(0,i.HT)(),getSortedRowModel:(0,i.h5)(),...g?{getPaginationRowModel:(0,i.kW)()}:{},enableSorting:!0,enableColumnResizing:!0,defaultColumn:{minSize:40,maxSize:500}});return(0,a.jsx)("div",{className:"rounded-lg custom-border relative",children:(0,a.jsx)("div",{className:"overflow-x-auto",children:(0,a.jsx)("div",{className:"relative min-w-full",children:(0,a.jsxs)(n.XI,{className:"[&_td]:py-2 [&_th]:py-2",style:{width:y.getTotalSize(),minWidth:"100%",tableLayout:"fixed"},children:[(0,a.jsx)(n.nd,{children:y.getHeaderGroups().map(e=>(0,a.jsx)(n.Hj,{children:e.headers.map(e=>(0,a.jsxs)(n.M_,{className:`py-1 h-8 relative ${"actions"===e.id?"sticky right-0 bg-white shadow-[-4px_0_8px_-6px_rgba(0,0,0,0.1)] w-[120px] ml-8":""} ${e.column.columnDef.meta?.className||""}`,style:{width:"actions"===e.id?120:e.getSize(),position:"actions"===e.id?"sticky":"relative",right:"actions"===e.id?0:"auto"},onClick:e.column.getCanSort()?e.column.getToggleSortingHandler():void 0,children:[(0,a.jsxs)("div",{className:"flex items-center justify-between gap-2",children:[(0,a.jsx)("div",{className:"flex items-center",children:e.isPlaceholder?null:(0,r.Kv)(e.column.columnDef.header,e.getContext())}),"actions"!==e.id&&e.column.getCanSort()&&(0,a.jsx)("div",{className:"w-4",children:e.column.getIsSorted()?({asc:(0,a.jsx)(o.A,{className:"h-4 w-4 text-blue-500"}),desc:(0,a.jsx)(c.A,{className:"h-4 w-4 text-blue-500"})})[e.column.getIsSorted()]:(0,a.jsx)(d.A,{className:"h-4 w-4 text-gray-400"})})]}),e.column.getCanResize()&&(0,a.jsx)("div",{onMouseDown:e.getResizeHandler(),onTouchStart:e.getResizeHandler(),className:`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none ${e.column.getIsResizing()?"bg-blue-500":"hover:bg-blue-200"}`})]},e.id))},e.id))}),(0,a.jsx)(n.BF,{children:s?(0,a.jsx)(n.Hj,{children:(0,a.jsx)(n.nA,{colSpan:t.length,className:"h-8 text-center",children:(0,a.jsx)("div",{className:"text-center text-gray-500",children:(0,a.jsx)("p",{children:"\uD83D\uDE85 Loading models..."})})})}):y.getRowModel().rows.length>0?y.getRowModel().rows.map(e=>(0,a.jsx)(n.Hj,{children:e.getVisibleCells().map(e=>(0,a.jsx)(n.nA,{className:`py-0.5 overflow-hidden ${"actions"===e.column.id?"sticky right-0 bg-white shadow-[-4px_0_8px_-6px_rgba(0,0,0,0.1)] w-[120px] ml-8":""} ${e.column.columnDef.meta?.className||""}`,style:{width:"actions"===e.column.id?120:e.column.getSize(),position:"actions"===e.column.id?"sticky":"relative",right:"actions"===e.column.id?0:"auto"},children:(0,r.Kv)(e.column.columnDef.cell,e.getContext())},e.id))},e.id)):(0,a.jsx)(n.Hj,{children:(0,a.jsx)(n.nA,{colSpan:t.length,className:"h-8 text-center",children:(0,a.jsx)("div",{className:"text-center text-gray-500",children:(0,a.jsx)("p",{children:"No models found"})})})})})]})})})})}},48658:(e,t,s)=>{s.d(t,{BF:()=>r.A,Hj:()=>o.A,M_:()=>n.A,XI:()=>a.A,nA:()=>i.A,nd:()=>l.A});var a=s(30489),r=s(96961),i=s(95517),l=s(8179),n=s(31556),o=s(95171)},72782:(e,t,s)=>{s.d(t,{A:()=>O});var a=s(95155),r=s(28436),i=s(75266),l=s(89270),n=s(12352),o=s(27428),c=s(65627),d=s(91485),m=s(98500),p=s.n(m),u=s(12115),g=s(42696),h=s(5266);function x(e){let t=t=>{"disableBlogPosts"===t.key&&e()},s=t=>{let{key:s}=t.detail;"disableBlogPosts"===s&&e()};return window.addEventListener("storage",t),window.addEventListener(h.xE,s),()=>{window.removeEventListener("storage",t),window.removeEventListener(h.xE,s)}}function _(){return"true"===(0,h._S)("disableBlogPosts")}var f=s(19041),b=s(13755),j=s(28630),A=s(94274),y=s(24805),v=s(68851),N=s(17432),w=s(41326),S=s(54481),I=s(7339),C=s(16989),k=s(6808),E=s(87278);let{Text:M}=w.A,P=({onLogout:e})=>{let{userId:t,userEmail:s,userRole:r}=(0,g.A)(),i=(0,f.y)(),l=(0,b.e)(),n=(0,u.useSyncExternalStore)(x,_),[o,c]=(0,u.useState)(!1);(0,u.useEffect)(()=>{c("true"===(0,h._S)("disableShowNewBadge"))},[]);let d=[{key:"logout",label:(0,a.jsxs)(S.A,{children:[(0,a.jsx)(j.A,{}),"Logout"]}),onClick:e}];return(0,a.jsx)(k.A,{menu:{items:d},popupRender:e=>(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow-lg",children:[(0,a.jsxs)(S.A,{direction:"vertical",size:"small",style:{width:"100%",padding:"12px"},children:[(0,a.jsx)(S.A,{style:{width:"100%",justifyContent:"space-between"},children:(0,a.jsxs)(S.A,{children:[(0,a.jsx)(A.A,{}),(0,a.jsx)(M,{type:"secondary",children:s||"-"})]})}),(0,a.jsx)(I.A,{style:{margin:"8px 0"}}),(0,a.jsxs)(S.A,{style:{width:"100%",justifyContent:"space-between"},children:[(0,a.jsxs)(S.A,{children:[(0,a.jsx)(y.A,{}),(0,a.jsx)(M,{type:"secondary",children:"User ID"})]}),(0,a.jsx)(M,{copyable:!0,ellipsis:!0,style:{maxWidth:"150px"},title:t||"-",children:t||"-"})]}),(0,a.jsxs)(S.A,{style:{width:"100%",justifyContent:"space-between"},children:[(0,a.jsxs)(S.A,{children:[(0,a.jsx)(v.A,{}),(0,a.jsx)(M,{type:"secondary",children:"Role"})]}),(0,a.jsx)(M,{children:r})]}),(0,a.jsx)(I.A,{style:{margin:"8px 0"}}),(0,a.jsxs)(S.A,{style:{width:"100%",justifyContent:"space-between"},children:[(0,a.jsx)(M,{type:"secondary",children:"Hide New Feature Indicators"}),(0,a.jsx)(C.A,{size:"small",checked:o,onChange:e=>{c(e),e?(0,h.AP)("disableShowNewBadge","true"):(0,h.sc)("disableShowNewBadge"),(0,h.mD)("disableShowNewBadge")},"aria-label":"Toggle hide new feature indicators"})]}),(0,a.jsxs)(S.A,{style:{width:"100%",justifyContent:"space-between"},children:[(0,a.jsx)(M,{type:"secondary",children:"Hide All Prompts"}),(0,a.jsx)(C.A,{size:"small",checked:i,onChange:e=>{e?(0,h.AP)("disableShowPrompts","true"):(0,h.sc)("disableShowPrompts"),(0,h.mD)("disableShowPrompts")},"aria-label":"Toggle hide all prompts"})]}),(0,a.jsxs)(S.A,{style:{width:"100%",justifyContent:"space-between"},children:[(0,a.jsx)(M,{type:"secondary",children:"Hide Usage Indicator"}),(0,a.jsx)(C.A,{size:"small",checked:l,onChange:e=>{e?(0,h.AP)("disableUsageIndicator","true"):(0,h.sc)("disableUsageIndicator"),(0,h.mD)("disableUsageIndicator")},"aria-label":"Toggle hide usage indicator"})]}),(0,a.jsxs)(S.A,{style:{width:"100%",justifyContent:"space-between"},children:[(0,a.jsx)(M,{type:"secondary",children:"Hide Blog Posts"}),(0,a.jsx)(C.A,{size:"small",checked:n,onChange:e=>{e?(0,h.AP)("disableBlogPosts","true"):(0,h.sc)("disableBlogPosts"),(0,h.mD)("disableBlogPosts")},"aria-label":"Toggle hide blog posts"})]})]}),(0,a.jsx)(I.A,{style:{margin:0}}),u.cloneElement(e,{style:{boxShadow:"none"}})]}),children:(0,a.jsx)(E.Ay,{type:"text",children:(0,a.jsxs)(S.A,{children:[(0,a.jsx)(y.A,{}),(0,a.jsx)(M,{children:"User"}),(0,a.jsx)(N.A,{})]})})})},O=({userID:e,userEmail:t,userRole:s,premiumUser:m,proxySettings:g,setProxySettings:h,accessToken:x,isPublicPage:_=!1,sidebarCollapsed:f=!1,onToggleSidebar:b,isDarkMode:j,toggleDarkMode:A})=>{let y=(0,r.getProxyBaseUrl)(),[v,N]=(0,u.useState)(""),{logoUrl:w}=(0,l.D)(),S=w&&(0,i.ZB)(w)&&!w.includes(i.eD)&&!(0,i.bP)(w)?w??i.Il:i.Il;return(0,u.useEffect)(()=>{(async()=>{if(x){let e=await (0,o.g)(x);console.log("response from fetchProxySettings",e),e&&h(e)}})()},[x]),(0,u.useEffect)(()=>{N(g?.PROXY_LOGOUT_URL||"")},[g]),(0,a.jsx)("nav",{className:"bg-white border-b border-gray-200 sticky top-0 z-10",children:(0,a.jsx)("div",{className:"w-full",children:(0,a.jsxs)("div",{className:"flex items-center h-14 px-4",children:[(0,a.jsxs)("div",{className:"flex items-center flex-shrink-0",children:[b&&(0,a.jsx)("button",{onClick:b,className:"flex items-center justify-center w-10 h-10 mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors",title:f?"Expand sidebar":"Collapse sidebar",children:(0,a.jsx)("span",{className:"text-lg",children:f?(0,a.jsx)(c.A,{}):(0,a.jsx)(d.A,{})})}),(0,a.jsx)("div",{className:"flex items-center gap-2",children:(0,a.jsx)(p(),{href:y||"/",className:"flex items-center",children:(0,a.jsx)("div",{className:"relative",children:(0,a.jsx)("div",{className:"h-8 max-w-40 flex items-center justify-center overflow-hidden",children:(0,a.jsx)("img",{src:S,alt:"Silinex Brand",className:"max-w-full max-h-full w-auto h-auto object-contain"})})})})})]}),(0,a.jsxs)("div",{className:"flex items-center space-x-5 ml-auto",children:[!1,!_&&(0,a.jsx)(a.Fragment,{children:(0,a.jsx)(P,{onLogout:()=>{(0,n.E)(),window.location.href=v}})})]})]})})})}},75266:(e,t,s)=>{s.d(t,{Il:()=>a,ZB:()=>n,bP:()=>l,eD:()=>r});let a="/ui/assets/logos/silinex.png",r="/get_image",i=["@lobehub/icons-static-png","siliconcloud-color.png"],l=e=>!!e&&i.some(t=>e.includes(t)),n=e=>{if(!e)return!1;let t=e.trim().toLowerCase();return!!t.startsWith("data:image/svg+xml")||t.endsWith(".svg")||t.includes(".svg?")}},78896:(e,t,s)=>{s.d(t,{A:()=>I});var a=s(95155),r=s(89270),i=s(53535),l=s(21104),n=s(38983),o=s(42837),c=s(75892),d=s(64628),m=s(99904),p=s(22277),u=s(48849),g=s(23060),h=s(3373),x=s(67635),_=s(68822),f=s(12115),b=s(48617),j=s(12120),A=s(72782),y=s(28436),v=s(39771),N=s(36690),w=s(90314);let{TabPane:S}=m.A,I=({accessToken:e,isEmbedded:t=!1})=>{let s,I,C,k,E,M,P,[O,$]=(0,f.useState)(null),[T,L]=(0,f.useState)(null),[z,D]=(0,f.useState)(null),[R,H]=(0,f.useState)("Silinex Gateway"),[F,G]=(0,f.useState)(null),[U,B]=(0,f.useState)(""),[K,W]=(0,f.useState)({}),[V,q]=(0,f.useState)(!0),[Y,J]=(0,f.useState)(!0),[X,Q]=(0,f.useState)(!0),[Z,ee]=(0,f.useState)(""),[et,es]=(0,f.useState)(""),[ea,er]=(0,f.useState)(""),[ei,el]=(0,f.useState)([]),[en,eo]=(0,f.useState)([]),[ec,ed]=(0,f.useState)([]),[em,ep]=(0,f.useState)([]),[eu,eg]=(0,f.useState)([]),[eh,ex]=(0,f.useState)("I'm alive! ✓"),[e_,ef]=(0,f.useState)(!1),[eb,ej]=(0,f.useState)(!1),[eA,ey]=(0,f.useState)(!1),[ev,eN]=(0,f.useState)(null),[ew,eS]=(0,f.useState)(null),[eI,eC]=(0,f.useState)(null),[ek,eE]=(0,f.useState)({}),[eM,eP]=(0,f.useState)("models");(0,f.useEffect)(()=>{(async()=>{try{await (0,y.getUiConfig)()}catch(e){console.error("Failed to get UI config:",e)}let e=async()=>{try{q(!0);let e=await (0,y.modelHubPublicModelsCall)();console.log("ModelHubData:",e),$(e)}catch(e){console.error("There was an error fetching the public model data",e),ex("Service unavailable")}finally{q(!1)}},t=async()=>{try{J(!0);let e=await (0,y.agentHubPublicModelsCall)();console.log("AgentHubData:",e),L(e)}catch(e){console.error("There was an error fetching the public agent data",e)}finally{J(!1)}},s=async()=>{try{Q(!0);let e=await (0,y.mcpHubPublicServersCall)();console.log("MCPHubData:",e),D(e)}catch(e){console.error("There was an error fetching the public MCP server data",e)}finally{Q(!1)}};(async()=>{let e=await (0,y.getPublicModelHubInfo)();console.log("Public Model Hub Info:",e),H(e.docs_title),G(e.custom_docs_description),B(e.litellm_version),W(e.useful_links||{})})(),e(),t(),s()})()},[]),(0,f.useEffect)(()=>{},[Z,ei,en,ec]);let eO=(0,f.useMemo)(()=>{if(!O||!Array.isArray(O))return[];let e=O;if(Z.trim()){let t=Z.toLowerCase(),s=t.split(/\s+/),a=O.filter(e=>{let a=e.model_group.toLowerCase();return!!a.includes(t)||s.every(e=>a.includes(e))});a.length>0&&(e=a.sort((e,s)=>{let a=e.model_group.toLowerCase(),r=s.model_group.toLowerCase(),i=1e3*(a===t),l=1e3*(r===t),n=100*!!a.startsWith(t),o=100*!!r.startsWith(t),c=50*!!t.split(/\s+/).every(e=>a.includes(e)),d=50*!!t.split(/\s+/).every(e=>r.includes(e)),m=a.length;return l+o+d+(1e3-r.length)-(i+n+c+(1e3-m))}))}return e.filter(e=>{let t=0===ei.length||ei.some(t=>e.providers.includes(t)),s=0===en.length||en.includes(e.mode||""),a=0===ec.length||Object.entries(e).filter(([e,t])=>e.startsWith("supports_")&&!0===t).some(([e])=>{let t=e.replace(/^supports_/,"").split("_").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ");return ec.includes(t)});return t&&s&&a})},[O,Z,ei,en,ec]),e$=(0,f.useMemo)(()=>{if(!T||!Array.isArray(T))return[];let e=T;if(et.trim()){let t=et.toLowerCase(),s=t.split(/\s+/);e=(e=T.filter(e=>{let a=e.name.toLowerCase(),r=e.description.toLowerCase();return!!(a.includes(t)||r.includes(t))||s.every(e=>a.includes(e)||r.includes(e))})).sort((e,s)=>{let a=e.name.toLowerCase(),r=s.name.toLowerCase(),i=1e3*(a===t),l=1e3*(r===t),n=100*!!a.startsWith(t),o=100*!!r.startsWith(t),c=i+n+(1e3-a.length);return l+o+(1e3-r.length)-c})}return e.filter(e=>0===em.length||e.skills?.some(e=>e.tags?.some(e=>em.includes(e))))},[T,et,em]),eT=(0,f.useMemo)(()=>{if(!z||!Array.isArray(z))return[];let e=z;if(ea.trim()){let t=ea.toLowerCase(),s=t.split(/\s+/);e=(e=z.filter(e=>{let a=e.server_name.toLowerCase(),r=(e.mcp_info?.description||"").toLowerCase();return!!(a.includes(t)||r.includes(t))||s.every(e=>a.includes(e)||r.includes(e))})).sort((e,s)=>{let a=e.server_name.toLowerCase(),r=s.server_name.toLowerCase(),i=1e3*(a===t),l=1e3*(r===t),n=100*!!a.startsWith(t),o=100*!!r.startsWith(t),c=i+n+(1e3-a.length);return l+o+(1e3-r.length)-c})}return e.filter(e=>0===eu.length||eu.includes(e.transport))},[z,ea,eu]),eL=e=>{navigator.clipboard.writeText(e),j.Ay.success("Copied to clipboard!")},ez=e=>e.replace(/^supports_/,"").split("_").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" "),eD=e=>`$${(1e6*e).toFixed(4)}`,eR=e=>e?e>=1e3?`${(e/1e3).toFixed(0)}K`:e.toString():"N/A";return(0,a.jsx)(r.N,{accessToken:e,children:(0,a.jsxs)("div",{className:t?"w-full":"min-h-screen bg-white",children:[!t&&(0,a.jsx)(A.A,{userID:null,userEmail:null,userRole:null,premiumUser:!1,setProxySettings:eE,proxySettings:ek,accessToken:e||null,isPublicPage:!0,isDarkMode:!1,toggleDarkMode:()=>{}}),(0,a.jsxs)("div",{className:t?"w-full p-6":"w-full px-8 py-12",children:[t&&(0,a.jsx)("div",{className:"mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg",children:(0,a.jsx)("p",{className:"text-sm text-gray-700",children:"These are models, agents, and MCP servers your proxy admin has indicated are available in your company."})}),!t&&(0,a.jsxs)(o.A,{className:"mb-10 p-8 bg-white border border-gray-200 rounded-lg shadow-sm",children:[(0,a.jsx)(d.A,{className:"text-2xl font-semibold mb-6 text-gray-900",children:"About"}),(0,a.jsx)("p",{className:"text-gray-700 mb-6 text-base leading-relaxed",children:F||"Proxy Server to call 100+ LLMs in the OpenAI format."}),(0,a.jsx)("div",{className:"flex items-center space-x-3 text-sm text-gray-600",children:(0,a.jsxs)("span",{className:"flex items-center",children:[(0,a.jsx)("span",{className:"w-4 h-4 mr-2",children:"\uD83D\uDD27"}),"Built with silinex: v",U]})})]}),K&&Object.keys(K).length>0&&(0,a.jsxs)(o.A,{className:"mb-10 p-8 bg-white border border-gray-200 rounded-lg shadow-sm",children:[(0,a.jsx)(d.A,{className:"text-2xl font-semibold mb-6 text-gray-900",children:"Useful Links"}),(0,a.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",children:Object.entries(K||{}).map(([e,t])=>({title:e,url:"string"==typeof t?t:t.url,index:"string"==typeof t?0:t.index??0})).sort((e,t)=>e.index-t.index).map(({title:e,url:t})=>(0,a.jsxs)("button",{onClick:()=>window.open(t,"_blank"),className:"flex items-center space-x-3 text-blue-600 hover:text-blue-800 transition-colors p-3 rounded-lg hover:bg-blue-50 border border-gray-200",children:[(0,a.jsx)(i.A,{className:"w-4 h-4"}),(0,a.jsx)(c.A,{className:"text-sm font-medium",children:e})]},e))})]}),!t&&(0,a.jsxs)(o.A,{className:"mb-10 p-8 bg-white border border-gray-200 rounded-lg shadow-sm",children:[(0,a.jsx)(d.A,{className:"text-2xl font-semibold mb-6 text-gray-900",children:"Health and Endpoint Status"}),(0,a.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:(0,a.jsxs)(c.A,{className:"text-green-600 font-medium text-sm",children:["Service status: ",eh]})})]}),(0,a.jsx)(o.A,{className:"p-8 bg-white border border-gray-200 rounded-lg shadow-sm",children:(0,a.jsxs)(m.A,{activeKey:eM,onChange:eP,size:"large",className:"public-hub-tabs",children:[(0,a.jsxs)(S,{tab:"Model Hub",children:[(0,a.jsx)("div",{className:"flex justify-between items-center mb-8",children:(0,a.jsx)(d.A,{className:"text-2xl font-semibold text-gray-900",children:"Available Models"})}),(0,a.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200",children:[(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{className:"flex items-center space-x-2 mb-3",children:[(0,a.jsx)(c.A,{className:"text-sm font-medium text-gray-700",children:"Search Models:"}),(0,a.jsx)(p.A,{title:"Smart search with relevance ranking - finds models containing your search terms, ranked by relevance. Try searching 'xai grok-4', 'claude-4', 'gpt-4', or 'sonnet'",placement:"top",children:(0,a.jsx)(_.A,{className:"w-4 h-4 text-gray-400 cursor-help"})})]}),(0,a.jsxs)("div",{className:"relative",children:[(0,a.jsx)(l.A,{className:"w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"}),(0,a.jsx)("input",{type:"text",placeholder:"Search model names... (smart search enabled)",value:Z,onChange:e=>ee(e.target.value),className:"border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"})]})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-sm font-medium mb-3 text-gray-700",children:"Provider:"}),(0,a.jsx)(g.A,{mode:"multiple",value:ei,onChange:e=>el(e),placeholder:"Select providers",className:"w-full",size:"large",allowClear:!0,optionRender:e=>{let{logo:t}=(0,w.li)(e.value);return(0,a.jsxs)("div",{className:"flex items-center space-x-2",children:[t&&(0,a.jsx)("img",{src:t,alt:e.label,className:"w-5 h-5 flex-shrink-0 object-contain",onError:e=>{e.target.style.display="none"}}),(0,a.jsx)("span",{className:"capitalize",children:e.label})]})},children:O&&Array.isArray(O)&&(s=new Set,O.forEach(e=>{e.providers.forEach(e=>s.add(e))}),Array.from(s)).map(e=>(0,a.jsx)(g.A.Option,{value:e,children:e},e))})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-sm font-medium mb-3 text-gray-700",children:"Mode:"}),(0,a.jsx)(g.A,{mode:"multiple",value:en,onChange:e=>eo(e),placeholder:"Select modes",className:"w-full",size:"large",allowClear:!0,children:O&&Array.isArray(O)&&(I=new Set,O.forEach(e=>{e.mode&&I.add(e.mode)}),Array.from(I)).map(e=>(0,a.jsx)(g.A.Option,{value:e,children:e},e))})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-sm font-medium mb-3 text-gray-700",children:"Features:"}),(0,a.jsx)(g.A,{mode:"multiple",value:ec,onChange:e=>ed(e),placeholder:"Select features",className:"w-full",size:"large",allowClear:!0,children:O&&Array.isArray(O)&&(C=new Set,O.forEach(e=>{Object.entries(e).filter(([e,t])=>e.startsWith("supports_")&&!0===t).forEach(([e])=>{let t=e.replace(/^supports_/,"").split("_").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ");C.add(t)})}),Array.from(C).sort()).map(e=>(0,a.jsx)(g.A.Option,{value:e,children:e},e))})]})]}),(0,a.jsx)(b.k,{columns:[{header:"Model Name",accessorKey:"model_group",enableSorting:!0,cell:({row:e})=>(0,a.jsx)("div",{className:"overflow-hidden",children:(0,a.jsx)(p.A,{title:e.original.model_group,children:(0,a.jsx)(n.A,{size:"xs",variant:"light",className:"font-mono text-blue-500 bg-blue-50 hover:bg-blue-100 text-xs font-normal px-2 py-0.5 text-left",onClick:()=>{eN(e.original),ef(!0)},children:e.original.model_group})})}),size:150},{header:"Providers",accessorKey:"providers",enableSorting:!0,cell:({row:e})=>{let t=e.original.providers;return(0,a.jsx)("div",{className:"flex flex-wrap gap-1",children:t.map(e=>{let{logo:t}=(0,w.li)(e);return(0,a.jsxs)("div",{className:"flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-xs",children:[t&&(0,a.jsx)("img",{src:t,alt:e,className:"w-3 h-3 flex-shrink-0 object-contain",onError:e=>{e.target.style.display="none"}}),(0,a.jsx)("span",{className:"capitalize",children:e})]},e)})})},size:120},{header:"Mode",accessorKey:"mode",enableSorting:!0,cell:({row:e})=>{let t=e.original.mode;return(0,a.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,a.jsx)("span",{children:(e=>{switch(e?.toLowerCase()){case"chat":return"\uD83D\uDCAC";case"rerank":return"\uD83D\uDD04";case"embedding":return"\uD83D\uDCC4";default:return"\uD83E\uDD16"}})(t||"")}),(0,a.jsx)(c.A,{children:t||"Chat"})]})},size:100},{header:"Max Input",accessorKey:"max_input_tokens",enableSorting:!0,cell:({row:e})=>(0,a.jsx)(c.A,{className:"text-center",children:eR(e.original.max_input_tokens)}),size:100,meta:{className:"text-center"}},{header:"Max Output",accessorKey:"max_output_tokens",enableSorting:!0,cell:({row:e})=>(0,a.jsx)(c.A,{className:"text-center",children:eR(e.original.max_output_tokens)}),size:100,meta:{className:"text-center"}},{header:"Input \xa5/1M",accessorKey:"input_cost_per_token",enableSorting:!0,cell:({row:e})=>{let t=e.original.input_cost_per_token;return(0,a.jsx)(c.A,{className:"text-center",children:t?eD(t):"Free"})},size:100,meta:{className:"text-center"}},{header:"Output \xa5/1M",accessorKey:"output_cost_per_token",enableSorting:!0,cell:({row:e})=>{let t=e.original.output_cost_per_token;return(0,a.jsx)(c.A,{className:"text-center",children:t?eD(t):"Free"})},size:100,meta:{className:"text-center"}},{header:"Features",accessorKey:"supports_vision",enableSorting:!1,cell:({row:e})=>{let t=Object.entries(e.original).filter(([e,t])=>e.startsWith("supports_")&&!0===t).map(([e])=>ez(e));return 0===t.length?(0,a.jsx)(c.A,{className:"text-gray-400",children:"-"}):1===t.length?(0,a.jsx)("div",{className:"h-6 flex items-center",children:(0,a.jsx)(u.A,{color:"blue",className:"text-xs",children:t[0]})}):(0,a.jsxs)("div",{className:"h-6 flex items-center space-x-1",children:[(0,a.jsx)(u.A,{color:"blue",className:"text-xs",children:t[0]}),(0,a.jsx)(p.A,{title:(0,a.jsxs)("div",{className:"space-y-1",children:[(0,a.jsx)("div",{className:"font-medium",children:"All Features:"}),t.map((e,t)=>(0,a.jsxs)("div",{className:"text-xs",children:["• ",e]},t))]}),trigger:"click",placement:"topLeft",children:(0,a.jsxs)("span",{className:"text-xs text-blue-600 cursor-pointer hover:text-blue-800 hover:underline",onClick:e=>e.stopPropagation(),children:["+",t.length-1]})})]})},size:120},{header:"Health Status",accessorKey:"health_status",enableSorting:!0,cell:({row:e})=>{let t=e.original,s="healthy"===t.health_status?"green":"unhealthy"===t.health_status?"red":"default",r=t.health_response_time?`Response Time: ${Number(t.health_response_time).toFixed(2)}ms`:"N/A",i=t.health_checked_at?`Last Checked: ${new Date(t.health_checked_at).toLocaleString()}`:"N/A";return(0,a.jsx)(p.A,{title:(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("div",{children:r}),(0,a.jsx)("div",{children:i})]}),children:(0,a.jsx)(u.A,{color:s,children:(0,a.jsx)("span",{className:"capitalize",children:t.health_status??"Unknown"})},t.model_group)})},size:100},{header:"Limits",accessorKey:"rpm",enableSorting:!0,cell:({row:e})=>{var t,s;let r,i=e.original;return(0,a.jsx)(c.A,{className:"text-xs text-gray-600",children:(t=i.rpm,s=i.tpm,r=[],t&&r.push(`RPM: ${t.toLocaleString()}`),s&&r.push(`TPM: ${s.toLocaleString()}`),r.length>0?r.join(", "):"N/A")})},size:150}],data:eO,isLoading:V,defaultSorting:[{id:"model_group",desc:!1}]}),(0,a.jsx)("div",{className:"mt-8 text-center",children:(0,a.jsxs)(c.A,{className:"text-sm text-gray-600",children:["Showing ",eO.length," of ",O?.length||0," models"]})})]},"models"),T&&Array.isArray(T)&&T.length>0&&(0,a.jsxs)(S,{tab:"Agent Hub",children:[(0,a.jsx)("div",{className:"flex justify-between items-center mb-8",children:(0,a.jsx)(d.A,{className:"text-2xl font-semibold text-gray-900",children:"Available Agents"})}),(0,a.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200",children:[(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{className:"flex items-center space-x-2 mb-3",children:[(0,a.jsx)(c.A,{className:"text-sm font-medium text-gray-700",children:"Search Agents:"}),(0,a.jsx)(p.A,{title:"Search agents by name or description",placement:"top",children:(0,a.jsx)(_.A,{className:"w-4 h-4 text-gray-400 cursor-help"})})]}),(0,a.jsxs)("div",{className:"relative",children:[(0,a.jsx)(l.A,{className:"w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"}),(0,a.jsx)("input",{type:"text",placeholder:"Search agent names or descriptions...",value:et,onChange:e=>es(e.target.value),className:"border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"})]})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-sm font-medium mb-3 text-gray-700",children:"Skills:"}),(0,a.jsx)(g.A,{mode:"multiple",value:em,onChange:e=>ep(e),placeholder:"Select skills",className:"w-full",size:"large",allowClear:!0,children:T&&Array.isArray(T)&&(k=new Set,T.forEach(e=>{e.skills?.forEach(e=>{e.tags?.forEach(e=>k.add(e))})}),Array.from(k).sort()).map(e=>(0,a.jsx)(g.A.Option,{value:e,children:e},e))})]})]}),(0,a.jsx)(b.k,{columns:[{header:"Agent Name",accessorKey:"name",enableSorting:!0,cell:({row:e})=>(0,a.jsx)("div",{className:"overflow-hidden",children:(0,a.jsx)(p.A,{title:e.original.name,children:(0,a.jsx)(n.A,{size:"xs",variant:"light",className:"font-mono text-blue-500 bg-blue-50 hover:bg-blue-100 text-xs font-normal px-2 py-0.5 text-left",onClick:()=>{eS(e.original),ej(!0)},children:e.original.name})})}),size:150},{header:"Description",accessorKey:"description",enableSorting:!1,cell:({row:e})=>{let t=e.original.description,s=t.length>80?t.substring(0,80)+"...":t;return(0,a.jsx)(p.A,{title:t,children:(0,a.jsx)(c.A,{className:"text-sm text-gray-700",children:s})})},size:250},{header:"Version",accessorKey:"version",enableSorting:!0,cell:({row:e})=>(0,a.jsx)(c.A,{className:"text-sm",children:e.original.version}),size:80},{header:"Provider",accessorKey:"provider",enableSorting:!1,cell:({row:e})=>{let t=e.original.provider;return t?(0,a.jsx)("div",{className:"text-sm",children:(0,a.jsx)(c.A,{className:"font-medium",children:t.organization})}):(0,a.jsx)(c.A,{className:"text-gray-400",children:"-"})},size:120},{header:"Skills",accessorKey:"skills",enableSorting:!1,cell:({row:e})=>{let t=e.original.skills||[];return 0===t.length?(0,a.jsx)(c.A,{className:"text-gray-400",children:"-"}):1===t.length?(0,a.jsx)("div",{className:"h-6 flex items-center",children:(0,a.jsx)(u.A,{color:"purple",className:"text-xs",children:t[0].name})}):(0,a.jsxs)("div",{className:"h-6 flex items-center space-x-1",children:[(0,a.jsx)(u.A,{color:"purple",className:"text-xs",children:t[0].name}),(0,a.jsx)(p.A,{title:(0,a.jsxs)("div",{className:"space-y-1",children:[(0,a.jsx)("div",{className:"font-medium",children:"All Skills:"}),t.map((e,t)=>(0,a.jsxs)("div",{className:"text-xs",children:["• ",e.name]},t))]}),trigger:"click",placement:"topLeft",children:(0,a.jsxs)("span",{className:"text-xs text-purple-600 cursor-pointer hover:text-purple-800 hover:underline",onClick:e=>e.stopPropagation(),children:["+",t.length-1]})})]})},size:150},{header:"Capabilities",accessorKey:"capabilities",enableSorting:!1,cell:({row:e})=>{let t=Object.entries(e.original.capabilities||{}).filter(([e,t])=>!0===t).map(([e])=>e);return 0===t.length?(0,a.jsx)(c.A,{className:"text-gray-400",children:"-"}):(0,a.jsx)("div",{className:"flex flex-wrap gap-1",children:t.map(e=>(0,a.jsx)(u.A,{color:"green",className:"text-xs capitalize",children:e},e))})},size:150}],data:e$,isLoading:Y,defaultSorting:[{id:"name",desc:!1}]}),(0,a.jsx)("div",{className:"mt-8 text-center",children:(0,a.jsxs)(c.A,{className:"text-sm text-gray-600",children:["Showing ",e$.length," of ",T?.length||0," agents"]})})]},"agents"),z&&Array.isArray(z)&&z.length>0&&(0,a.jsxs)(S,{tab:"MCP Hub",children:[(0,a.jsx)("div",{className:"flex justify-between items-center mb-8",children:(0,a.jsx)(d.A,{className:"text-2xl font-semibold text-gray-900",children:"Available MCP Servers"})}),(0,a.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200",children:[(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{className:"flex items-center space-x-2 mb-3",children:[(0,a.jsx)(c.A,{className:"text-sm font-medium text-gray-700",children:"Search MCP Servers:"}),(0,a.jsx)(p.A,{title:"Search MCP servers by name or description",placement:"top",children:(0,a.jsx)(_.A,{className:"w-4 h-4 text-gray-400 cursor-help"})})]}),(0,a.jsxs)("div",{className:"relative",children:[(0,a.jsx)(l.A,{className:"w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"}),(0,a.jsx)("input",{type:"text",placeholder:"Search MCP server names or descriptions...",value:ea,onChange:e=>er(e.target.value),className:"border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"})]})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-sm font-medium mb-3 text-gray-700",children:"Transport:"}),(0,a.jsx)(g.A,{mode:"multiple",value:eu,onChange:e=>eg(e),placeholder:"Select transport types",className:"w-full",size:"large",allowClear:!0,children:z&&Array.isArray(z)&&(E=new Set,z.forEach(e=>{e.transport&&E.add(e.transport)}),Array.from(E).sort()).map(e=>(0,a.jsx)(g.A.Option,{value:e,children:e},e))})]})]}),(0,a.jsx)(b.k,{columns:[{header:"Server Name",accessorKey:"server_name",enableSorting:!0,cell:({row:e})=>(0,a.jsx)("div",{className:"overflow-hidden",children:(0,a.jsx)(p.A,{title:e.original.server_name,children:(0,a.jsx)(n.A,{size:"xs",variant:"light",className:"font-mono text-blue-500 bg-blue-50 hover:bg-blue-100 text-xs font-normal px-2 py-0.5 text-left",onClick:()=>{eC(e.original),ey(!0)},children:e.original.server_name})})}),size:150},{header:"Description",accessorKey:"mcp_info.description",enableSorting:!1,cell:({row:e})=>{let t=e.original.mcp_info?.description||"-",s=t.length>80?t.substring(0,80)+"...":t;return(0,a.jsx)(p.A,{title:t,children:(0,a.jsx)(c.A,{className:"text-sm text-gray-700",children:s})})},size:250},{header:"URL",accessorKey:"url",enableSorting:!1,cell:({row:e})=>{let t=e.original.url,s=t.length>40?t.substring(0,40)+"...":t;return(0,a.jsx)(p.A,{title:t,children:(0,a.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,a.jsx)(c.A,{className:"text-xs font-mono",children:s}),(0,a.jsx)(x.A,{onClick:()=>eL(t),className:"cursor-pointer text-gray-500 hover:text-blue-500 w-3 h-3"})]})})},size:200},{header:"Transport",accessorKey:"transport",enableSorting:!0,cell:({row:e})=>{let t=e.original.transport;return(0,a.jsx)(u.A,{color:"blue",className:"text-xs uppercase",children:t})},size:100},{header:"Auth Type",accessorKey:"auth_type",enableSorting:!0,cell:({row:e})=>{let t=e.original.auth_type;return(0,a.jsx)(u.A,{color:"none"===t?"gray":"green",className:"text-xs capitalize",children:t})},size:100}],data:eT,isLoading:X,defaultSorting:[{id:"server_name",desc:!1}]}),(0,a.jsx)("div",{className:"mt-8 text-center",children:(0,a.jsxs)(c.A,{className:"text-sm text-gray-600",children:["Showing ",eT.length," of ",z?.length||0," MCP servers"]})})]},"mcp")]})})]}),(0,a.jsx)(h.A,{title:(0,a.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,a.jsx)("span",{children:ev?.model_group||"Model Details"}),ev&&(0,a.jsx)(p.A,{title:"Copy model name",children:(0,a.jsx)(x.A,{onClick:()=>eL(ev.model_group),className:"cursor-pointer text-gray-500 hover:text-blue-500 w-4 h-4"})})]}),width:1e3,open:e_,footer:null,onOk:()=>{ef(!1),eN(null)},onCancel:()=>{ef(!1),eN(null)},children:ev&&(0,a.jsxs)("div",{className:"space-y-6",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Model Overview"}),(0,a.jsxs)("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Model Name:"}),(0,a.jsx)(c.A,{children:ev.model_group})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Mode:"}),(0,a.jsx)(c.A,{children:ev.mode||"Not specified"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Providers:"}),(0,a.jsx)("div",{className:"flex flex-wrap gap-1 mt-1",children:ev.providers.map(e=>{let{logo:t}=(0,w.li)(e);return(0,a.jsx)(u.A,{color:"blue",children:(0,a.jsxs)("div",{className:"flex items-center space-x-1",children:[t&&(0,a.jsx)("img",{src:t,alt:e,className:"w-3 h-3 flex-shrink-0 object-contain",onError:e=>{e.target.style.display="none"}}),(0,a.jsx)("span",{className:"capitalize",children:e})]})},e)})})]})]}),ev.model_group.includes("*")&&(0,a.jsx)("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4",children:(0,a.jsxs)("div",{className:"flex items-start space-x-2",children:[(0,a.jsx)(_.A,{className:"w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium text-blue-900 mb-2",children:"Wildcard Routing"}),(0,a.jsxs)(c.A,{className:"text-sm text-blue-800 mb-2",children:["This model uses wildcard routing. You can pass any value where you see the"," ",(0,a.jsx)("code",{className:"bg-blue-100 px-1 py-0.5 rounded text-xs",children:"*"})," symbol."]}),(0,a.jsxs)(c.A,{className:"text-sm text-blue-800",children:["For example, with"," ",(0,a.jsx)("code",{className:"bg-blue-100 px-1 py-0.5 rounded text-xs",children:ev.model_group}),", you can use any string (",(0,a.jsx)("code",{className:"bg-blue-100 px-1 py-0.5 rounded text-xs",children:ev.model_group.replace("*","my-custom-value")}),") that matches this pattern."]})]})]})})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Token & Cost Information"}),(0,a.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Max Input Tokens:"}),(0,a.jsx)(c.A,{children:ev.max_input_tokens?.toLocaleString()||"Not specified"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Max Output Tokens:"}),(0,a.jsx)(c.A,{children:ev.max_output_tokens?.toLocaleString()||"Not specified"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Input Cost per 1M Tokens:"}),(0,a.jsx)(c.A,{children:ev.input_cost_per_token?eD(ev.input_cost_per_token):"Not specified"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Output Cost per 1M Tokens:"}),(0,a.jsx)(c.A,{children:ev.output_cost_per_token?eD(ev.output_cost_per_token):"Not specified"})]})]})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Capabilities"}),(0,a.jsx)("div",{className:"flex flex-wrap gap-2",children:(M=Object.entries(ev).filter(([e,t])=>e.startsWith("supports_")&&!0===t).map(([e])=>e),P=["green","blue","purple","orange","red","yellow"],0===M.length?(0,a.jsx)(c.A,{className:"text-gray-500",children:"No special capabilities listed"}):M.map((e,t)=>(0,a.jsx)(u.A,{color:P[t%P.length],children:ez(e)},e)))})]}),(ev.tpm||ev.rpm)&&(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Rate Limits"}),(0,a.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[ev.tpm&&(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Tokens per Minute:"}),(0,a.jsx)(c.A,{children:ev.tpm.toLocaleString()})]}),ev.rpm&&(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Requests per Minute:"}),(0,a.jsx)(c.A,{children:ev.rpm.toLocaleString()})]})]})]}),ev.supported_openai_params&&(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Supported OpenAI Parameters"}),(0,a.jsx)("div",{className:"flex flex-wrap gap-2",children:ev.supported_openai_params.map(e=>(0,a.jsx)(u.A,{color:"green",children:e},e))})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Usage Example"}),(0,a.jsx)("div",{className:"bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto",children:(0,a.jsx)("pre",{className:"text-sm",children:(0,v.O)({apiKeySource:"custom",accessToken:null,apiKey:"your_api_key",inputMessage:"Hello, how are you?",chatHistory:[{role:"user",content:"Hello, how are you?",isImage:!1}],selectedTags:[],selectedVectorStores:[],selectedGuardrails:[],selectedPolicies:[],selectedMCPServers:[],endpointType:(0,N.yz)(ev.mode||"chat"),selectedModel:ev.model_group,selectedSdk:"openai"})})}),(0,a.jsx)("div",{className:"mt-2 text-right",children:(0,a.jsx)("button",{onClick:()=>{eL((0,v.O)({apiKeySource:"custom",accessToken:null,apiKey:"your_api_key",inputMessage:"Hello, how are you?",chatHistory:[{role:"user",content:"Hello, how are you?",isImage:!1}],selectedTags:[],selectedVectorStores:[],selectedGuardrails:[],selectedPolicies:[],selectedMCPServers:[],endpointType:(0,N.yz)(ev.mode||"chat"),selectedModel:ev.model_group,selectedSdk:"openai"}))},className:"text-sm text-blue-600 hover:text-blue-800 cursor-pointer",children:"Copy to clipboard"})})]})]})}),(0,a.jsx)(h.A,{title:(0,a.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,a.jsx)("span",{children:ew?.name||"Agent Details"}),ew&&(0,a.jsx)(p.A,{title:"Copy agent name",children:(0,a.jsx)(x.A,{onClick:()=>eL(ew.name),className:"cursor-pointer text-gray-500 hover:text-blue-500 w-4 h-4"})})]}),width:1e3,open:eb,footer:null,onOk:()=>{ej(!1),eS(null)},onCancel:()=>{ej(!1),eS(null)},children:ew&&(0,a.jsxs)("div",{className:"space-y-6",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Agent Overview"}),(0,a.jsxs)("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Name:"}),(0,a.jsx)(c.A,{children:ew.name})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Version:"}),(0,a.jsx)(c.A,{children:ew.version})]}),(0,a.jsxs)("div",{className:"col-span-2",children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Description:"}),(0,a.jsx)(c.A,{children:ew.description})]}),ew.url&&(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"URL:"}),(0,a.jsx)("a",{href:ew.url,target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 hover:text-blue-800 text-sm break-all",children:ew.url})]})]})]}),ew.capabilities&&(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Capabilities"}),(0,a.jsx)("div",{className:"flex flex-wrap gap-2",children:Object.entries(ew.capabilities).filter(([e,t])=>!0===t).map(([e])=>(0,a.jsx)(u.A,{color:"green",className:"capitalize",children:e},e))})]}),ew.skills&&ew.skills.length>0&&(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Skills"}),(0,a.jsx)("div",{className:"space-y-4",children:ew.skills.map((e,t)=>(0,a.jsxs)("div",{className:"border border-gray-200 rounded-lg p-4",children:[(0,a.jsx)("div",{className:"flex items-start justify-between mb-2",children:(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium text-base",children:e.name}),(0,a.jsx)(c.A,{className:"text-sm text-gray-600",children:e.description})]})}),e.tags&&e.tags.length>0&&(0,a.jsx)("div",{className:"flex flex-wrap gap-1 mt-2",children:e.tags.map(e=>(0,a.jsx)(u.A,{color:"purple",className:"text-xs",children:e},e))})]},t))})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Input/Output Modes"}),(0,a.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Input Modes:"}),(0,a.jsx)("div",{className:"flex flex-wrap gap-1 mt-1",children:ew.defaultInputModes?.map(e=>(0,a.jsx)(u.A,{color:"blue",children:e},e))})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Output Modes:"}),(0,a.jsx)("div",{className:"flex flex-wrap gap-1 mt-1",children:ew.defaultOutputModes?.map(e=>(0,a.jsx)(u.A,{color:"blue",children:e},e))})]})]})]}),ew.documentationUrl&&(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Documentation"}),(0,a.jsxs)("a",{href:ew.documentationUrl,target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 hover:text-blue-800 flex items-center space-x-2",children:[(0,a.jsx)(i.A,{className:"w-4 h-4"}),(0,a.jsx)("span",{children:"View Documentation"})]})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Usage Example (A2A Protocol)"}),(0,a.jsxs)("div",{className:"mb-4",children:[(0,a.jsx)(c.A,{className:"text-sm font-medium mb-2 text-gray-700",children:"Step 1: Retrieve Agent Card"}),(0,a.jsx)("div",{className:"bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto",children:(0,a.jsx)("pre",{className:"text-xs",children:`base_url = '${ew.url}'

resolver = A2ACardResolver(
    httpx_client=httpx_client,
    base_url=base_url,
    # agent_card_path uses default, extended_agent_card_path also uses default
)

# Fetch Public Agent Card and Initialize Client
final_agent_card_to_use: AgentCard | None = None
_public_card = (
    await resolver.get_agent_card()
)  # Fetches from default public path - \`/agents/{agent_id}/\`
final_agent_card_to_use = _public_card

if _public_card.supports_authenticated_extended_card:
    try:
        auth_headers_dict = {
            'Authorization': 'Bearer dummy-token-for-extended-card'
        }
        _extended_card = await resolver.get_agent_card(
            relative_card_path=EXTENDED_AGENT_CARD_PATH,
            http_kwargs={'headers': auth_headers_dict},
        )
        final_agent_card_to_use = (
            _extended_card  # Update to use the extended card
        )
    except Exception as e_extended:
        logger.warning(
            f'Failed to fetch extended agent card: {e_extended}. Will proceed with public card.',
            exc_info=True,
        )`})}),(0,a.jsx)("div",{className:"mt-2 text-right",children:(0,a.jsx)("button",{onClick:()=>{eL(`from a2a.client import A2ACardResolver, A2AClient
from a2a.types import (
    AgentCard,
    MessageSendParams,
    SendMessageRequest,
    SendStreamingMessageRequest,
)
from a2a.utils.constants import (
    AGENT_CARD_WELL_KNOWN_PATH,
    EXTENDED_AGENT_CARD_PATH,
)

base_url = '${ew.url}'

resolver = A2ACardResolver(
    httpx_client=httpx_client,
    base_url=base_url,
    # agent_card_path uses default, extended_agent_card_path also uses default
)

# Fetch Public Agent Card and Initialize Client
final_agent_card_to_use: AgentCard | None = None
_public_card = (
    await resolver.get_agent_card()
)  # Fetches from default public path - \`/agents/{agent_id}/\`
final_agent_card_to_use = _public_card

if _public_card.supports_authenticated_extended_card:
    try:
        auth_headers_dict = {
            'Authorization': 'Bearer dummy-token-for-extended-card'
        }
        _extended_card = await resolver.get_agent_card(
            relative_card_path=EXTENDED_AGENT_CARD_PATH,
            http_kwargs={'headers': auth_headers_dict},
        )
        final_agent_card_to_use = (
            _extended_card  # Update to use the extended card
        )
    except Exception as e_extended:
        logger.warning(
            f'Failed to fetch extended agent card: {e_extended}. Will proceed with public card.',
            exc_info=True,
        )`)},className:"text-sm text-blue-600 hover:text-blue-800 cursor-pointer",children:"Copy to clipboard"})})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-sm font-medium mb-2 text-gray-700",children:"Step 2: Call the Agent"}),(0,a.jsx)("div",{className:"bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto",children:(0,a.jsx)("pre",{className:"text-xs",children:`client = A2AClient(
    httpx_client=httpx_client, agent_card=final_agent_card_to_use
)

send_message_payload: dict[str, Any] = {
    'message': {
        'role': 'user',
        'parts': [
            {'kind': 'text', 'text': 'how much is 10 CNY in INR?'}
        ],
        'messageId': uuid4().hex,
    },
}
request = SendMessageRequest(
    id=str(uuid4()), params=MessageSendParams(**send_message_payload)
)

response = await client.send_message(request)
print(response.model_dump(mode='json', exclude_none=True))`})}),(0,a.jsx)("div",{className:"mt-2 text-right",children:(0,a.jsx)("button",{onClick:()=>{eL(`client = A2AClient(
    httpx_client=httpx_client, agent_card=final_agent_card_to_use
)

send_message_payload: dict[str, Any] = {
    'message': {
        'role': 'user',
        'parts': [
            {'kind': 'text', 'text': 'how much is 10 CNY in INR?'}
        ],
        'messageId': uuid4().hex,
    },
}
request = SendMessageRequest(
    id=str(uuid4()), params=MessageSendParams(**send_message_payload)
)

response = await client.send_message(request)
print(response.model_dump(mode='json', exclude_none=True))`)},className:"text-sm text-blue-600 hover:text-blue-800 cursor-pointer",children:"Copy to clipboard"})})]})]})]})}),(0,a.jsx)(h.A,{title:(0,a.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,a.jsx)("span",{children:eI?.server_name||"MCP Server Details"}),eI&&(0,a.jsx)(p.A,{title:"Copy server name",children:(0,a.jsx)(x.A,{onClick:()=>eL(eI.server_name),className:"cursor-pointer text-gray-500 hover:text-blue-500 w-4 h-4"})})]}),width:1e3,open:eA,footer:null,onOk:()=>{ey(!1),eC(null)},onCancel:()=>{ey(!1),eC(null)},children:eI&&(0,a.jsxs)("div",{className:"space-y-6",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Server Overview"}),(0,a.jsxs)("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Server Name:"}),(0,a.jsx)(c.A,{children:eI.server_name})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Transport:"}),(0,a.jsx)(u.A,{color:"blue",children:eI.transport})]}),eI.alias&&(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Alias:"}),(0,a.jsx)(c.A,{children:eI.alias})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Auth Type:"}),(0,a.jsx)(u.A,{color:"none"===eI.auth_type?"gray":"green",children:eI.auth_type})]}),(0,a.jsxs)("div",{className:"col-span-2",children:[(0,a.jsx)(c.A,{className:"font-medium",children:"Description:"}),(0,a.jsx)(c.A,{children:eI.mcp_info?.description||"-"})]}),(0,a.jsxs)("div",{className:"col-span-2",children:[(0,a.jsx)(c.A,{className:"font-medium",children:"URL:"}),(0,a.jsxs)("a",{href:eI.url,target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 hover:text-blue-800 text-sm break-all flex items-center space-x-2",children:[(0,a.jsx)("span",{children:eI.url}),(0,a.jsx)(i.A,{className:"w-4 h-4"})]})]})]})]}),eI.mcp_info&&Object.keys(eI.mcp_info).length>0&&(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Additional Information"}),(0,a.jsx)("div",{className:"bg-gray-50 p-4 rounded-lg",children:(0,a.jsx)("pre",{className:"text-xs overflow-x-auto",children:JSON.stringify(eI.mcp_info,null,2)})})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)(c.A,{className:"text-lg font-semibold mb-4",children:"Usage Example"}),(0,a.jsx)("div",{className:"bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto",children:(0,a.jsx)("pre",{className:"text-sm",children:`# Using MCP Server with Python FastMCP

from fastmcp import Client
import asyncio

# Standard MCP configuration
config = {
    "mcpServers": {
        "${eI.server_name}": {
            "url": "http://localhost:4000/${eI.server_name}/mcp",
            "headers": {
                "x-silinex-api-key": "Bearer sk-1234"
            }
        }
    }
}

# Create a client that connects to the server
client = Client(config)

async def main():
    async with client:
        # List available tools
        tools = await client.list_tools()
        print(f"Available tools: {[tool.name for tool in tools]}")

        # Call a tool
        response = await client.call_tool(
            name="tool_name", 
            arguments={"arg": "value"}
        )
        print(f"Response: {response}")

if __name__ == "__main__":
    asyncio.run(main())`})}),(0,a.jsx)("div",{className:"mt-2 text-right",children:(0,a.jsx)("button",{onClick:()=>{eL(`# Using MCP Server with Python FastMCP

from fastmcp import Client
import asyncio

# Standard MCP configuration
config = {
    "mcpServers": {
        "${eI.server_name}": {
            "url": "http://localhost:4000/${eI.server_name}/mcp",
            "headers": {
                "x-silinex-api-key": "Bearer sk-1234"
            }
        }
    }
}

# Create a client that connects to the server
client = Client(config)

async def main():
    async with client:
        # List available tools
        tools = await client.list_tools()
        print(f"Available tools: {[tool.name for tool in tools]}")

        # Call a tool
        response = await client.call_tool(
            name="tool_name", 
            arguments={"arg": "value"}
        )
        print(f"Response: {response}")

if __name__ == "__main__":
    asyncio.run(main())`)},className:"text-sm text-blue-600 hover:text-blue-800 cursor-pointer",children:"Copy to clipboard"})})]})]})})]})})}},89270:(e,t,s)=>{s.d(t,{D:()=>n,N:()=>o});var a=s(95155),r=s(12115),i=s(28436);let l=(0,r.createContext)(void 0),n=()=>{let e=(0,r.useContext)(l);if(!e)throw Error("useTheme must be used within a ThemeProvider");return e},o=({children:e,accessToken:t})=>{let[s,n]=(0,r.useState)(null),[o,c]=(0,r.useState)(null);return(0,r.useEffect)(()=>{(async()=>{try{let e=(0,i.getProxyBaseUrl)(),t=e?`${e}/get/ui_theme_settings`:"/get/ui_theme_settings",s=await fetch(t,{method:"GET",headers:{"Content-Type":"application/json"}});if(s.ok){let e=await s.json();e.values?.logo_url&&n(e.values.logo_url),e.values?.favicon_url&&c(e.values.favicon_url)}}catch(e){console.warn("Failed to load theme settings from backend:",e)}})()},[]),(0,r.useEffect)(()=>{if(o){let e=document.querySelectorAll("link[rel*='icon']");if(e.length>0)e.forEach(e=>{e.href=o});else{let e=document.createElement("link");e.rel="icon",e.href=o,document.head.appendChild(e)}}},[o]),(0,a.jsx)(l.Provider,{value:{logoUrl:s,setLogoUrl:n,faviconUrl:o,setFaviconUrl:c},children:e})}},90314:(e,t,s)=>{s.d(t,{G_:()=>c,JQ:()=>i,SM:()=>d,bb:()=>r,li:()=>o,rm:()=>n});var a,r=((a={}).A2A_Agent="A2A Agent",a.AIML="AI/ML API",a.Bedrock="Amazon Bedrock",a.Anthropic="Anthropic",a.AssemblyAI="AssemblyAI",a.SageMaker="AWS SageMaker",a.Azure="Azure",a.Azure_AI_Studio="Azure AI Foundry (Studio)",a.Cerebras="Cerebras",a.Cohere="Cohere",a.Dashscope="Dashscope",a.Databricks="Databricks (Qwen API)",a.DeepInfra="DeepInfra",a.Deepgram="Deepgram",a.Deepseek="Deepseek",a.ElevenLabs="ElevenLabs",a.FalAI="Fal AI",a.FireworksAI="Fireworks AI",a.Google_AI_Studio="Google AI Studio",a.GradientAI="GradientAI",a.Groq="Groq",a.Hosted_Vllm="vllm",a.Infinity="Infinity",a.JinaAI="Jina AI",a.MiniMax="MiniMax",a.MistralAI="Mistral AI",a.Ollama="Ollama",a.OpenAI="OpenAI",a.OpenAI_Compatible="OpenAI-Compatible Endpoints (Together AI, etc.)",a.OpenAI_Text="OpenAI Text Completion",a.OpenAI_Text_Compatible="OpenAI-Compatible Text Completion Models (Together AI, etc.)",a.Openrouter="Openrouter",a.Oracle="Oracle Cloud Infrastructure (OCI)",a.Perplexity="Perplexity",a.RunwayML="RunwayML",a.Sambanova="Sambanova",a.Snowflake="Snowflake",a.TogetherAI="TogetherAI",a.Triton="Triton",a.Vertex_AI="Vertex AI (Anthropic, Gemini, etc.)",a.VolcEngine="VolcEngine",a.Voyage="Voyage AI",a.xAI="xAI",a.SAP="SAP Generative AI Hub",a.Watsonx="Watsonx",a);let i={A2A_Agent:"a2a_agent",AIML:"aiml",OpenAI:"openai",OpenAI_Text:"text-completion-openai",Azure:"azure",Azure_AI_Studio:"azure_ai",Anthropic:"anthropic",Google_AI_Studio:"gemini",Bedrock:"bedrock",Groq:"groq",MiniMax:"minimax",MistralAI:"mistral",Cohere:"cohere",OpenAI_Compatible:"openai",OpenAI_Text_Compatible:"text-completion-openai",Vertex_AI:"vertex_ai",Databricks:"databricks",Dashscope:"dashscope",xAI:"xai",Deepseek:"deepseek",Ollama:"ollama",AssemblyAI:"assemblyai",Cerebras:"cerebras",Sambanova:"sambanova",Perplexity:"perplexity",RunwayML:"runwayml",TogetherAI:"together_ai",Openrouter:"openrouter",Oracle:"oci",Snowflake:"snowflake",FireworksAI:"fireworks_ai",GradientAI:"gradient_ai",Triton:"triton",Deepgram:"deepgram",ElevenLabs:"elevenlabs",FalAI:"fal_ai",SageMaker:"sagemaker_chat",Voyage:"voyage",JinaAI:"jina_ai",VolcEngine:"volcengine",DeepInfra:"deepinfra",Hosted_Vllm:"hosted_vllm",Infinity:"infinity",SAP:"sap",Watsonx:"watsonx"},l="../ui/assets/logos/",n={"A2A Agent":`${l}a2a_agent.png`,"AI/ML API":`${l}aiml_api.svg`,Anthropic:`${l}anthropic.svg`,AssemblyAI:`${l}assemblyai_small.png`,Azure:`${l}microsoft_azure.svg`,"Azure AI Foundry (Studio)":`${l}microsoft_azure.svg`,"Amazon Bedrock":`${l}bedrock.svg`,"AWS SageMaker":`${l}bedrock.svg`,Cerebras:`${l}cerebras.svg`,Cohere:`${l}cohere.svg`,"Databricks (Qwen API)":`${l}databricks.svg`,Dashscope:`${l}dashscope.svg`,Deepseek:`${l}deepseek.svg`,"Fireworks AI":`${l}fireworks.svg`,Groq:`${l}groq.svg`,"Google AI Studio":`${l}google.svg`,vllm:`${l}vllm.png`,Infinity:`${l}infinity.png`,MiniMax:`${l}minimax.svg`,"Mistral AI":`${l}mistral.svg`,Ollama:`${l}ollama.svg`,OpenAI:`${l}openai_small.svg`,"OpenAI Text Completion":`${l}openai_small.svg`,"OpenAI-Compatible Text Completion Models (Together AI, etc.)":`${l}openai_small.svg`,"OpenAI-Compatible Endpoints (Together AI, etc.)":`${l}openai_small.svg`,Openrouter:`${l}openrouter.svg`,"Oracle Cloud Infrastructure (OCI)":`${l}oracle.svg`,Perplexity:`${l}perplexity-ai.svg`,RunwayML:`${l}runwayml.png`,Sambanova:`${l}sambanova.svg`,Snowflake:`${l}snowflake.svg`,TogetherAI:`${l}togetherai.svg`,"Vertex AI (Anthropic, Gemini, etc.)":`${l}google.svg`,xAI:`${l}xai.svg`,GradientAI:`${l}gradientai.svg`,Triton:`${l}nvidia_triton.png`,Deepgram:`${l}deepgram.png`,ElevenLabs:`${l}elevenlabs.png`,"Fal AI":`${l}fal_ai.jpg`,"Voyage AI":`${l}voyage.webp`,"Jina AI":`${l}jina.png`,VolcEngine:`${l}volcengine.png`,DeepInfra:`${l}deepinfra.png`,"SAP Generative AI Hub":`${l}sap.png`},o=e=>{if(!e)return{logo:"",displayName:"-"};if("gemini"===e.toLowerCase()){let e="Google AI Studio";return{logo:n[e],displayName:e}}let t=Object.keys(i).find(t=>i[t].toLowerCase()===e.toLowerCase());if(!t)return{logo:"",displayName:e};let s=r[t];return{logo:n[s],displayName:s}},c=e=>{if("AI/ML API"===e)return"aiml/flux-pro/v1.1";if("Vertex AI (Anthropic, Gemini, etc.)"===e)return"gemini-pro";if("Anthropic"==e)return"claude-3-opus";if("Amazon Bedrock"==e)return"claude-3-opus";if("AWS SageMaker"==e)return"sagemaker/jumpstart-dft-meta-textgeneration-llama-2-7b";else if("Google AI Studio"==e)return"gemini-pro";else if("Azure AI Foundry (Studio)"==e)return"azure_ai/command-r-plus";else if("Azure"==e)return"my-deployment";else if("Oracle Cloud Infrastructure (OCI)"==e)return"oci/xai.grok-4";else if("Snowflake"==e)return"snowflake/mistral-7b";else if("Voyage AI"==e)return"voyage/";else if("Jina AI"==e)return"jina_ai/";else if("VolcEngine"==e)return"volcengine/<any-model-on-volcengine>";else if("DeepInfra"==e)return"deepinfra/<any-model-on-deepinfra>";else if("Fal AI"==e)return"fal_ai/fal-ai/flux-pro/v1.1-ultra";else if("RunwayML"==e)return"runwayml/gen4_turbo";else if("Watsonx"===e)return"watsonx/ibm/granite-3-3-8b-instruct";else return"gpt-3.5-turbo"},d=(e,t)=>{console.log(`Provider key: ${e}`);let s=i[e];console.log(`Provider mapped to: ${s}`);let a=[];return e&&"object"==typeof t&&(Object.entries(t).forEach(([e,t])=>{if(null!==t&&"object"==typeof t&&"litellm_provider"in t){let r=t.litellm_provider;(r===s||"string"==typeof r&&r.includes(s))&&a.push(e)}}),"Cohere"==e&&(console.log("Adding cohere chat models"),Object.entries(t).forEach(([e,t])=>{null!==t&&"object"==typeof t&&"litellm_provider"in t&&"cohere_chat"===t.litellm_provider&&a.push(e)})),"AWS SageMaker"==e&&(console.log("Adding sagemaker chat models"),Object.entries(t).forEach(([e,t])=>{null!==t&&"object"==typeof t&&"litellm_provider"in t&&"sagemaker_chat"===t.litellm_provider&&a.push(e)}))),a}}}]);