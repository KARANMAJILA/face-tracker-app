// app/lib/deepai.js
export async function detectFaceFromCanvas(canvas) {
  const imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
  const formData = new FormData();
  formData.append('image', imageBlob, 'snapshot.jpg');

  const res = await fetch('https://api.deepai.org/api/facial-recognition', {
    method: 'POST',
    headers: {
      'api-key': 'a51b91c6-5d41-4760-80cf-75f036b65d09',
    },
    body: formData,
  });

  const data = await res.json();

  if (!data.output || !data.output.faces) {
    console.warn('DeepAI response missing faces:', data);
    return []; 
  }

  return data.output.faces;
}
