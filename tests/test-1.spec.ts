import { test, expect, Page } from '@playwright/test';

// URL de un video de YouTube (ejemplo: Big Buck Bunny, Creative Commons)
const YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';

test.describe('YouTube Video Playback Test', () => {
  test('debería navegar a YouTube, manejar cookies, reproducir video y hacer scroll', async ({ page }) => {
    // 1. Navega a la URL
    console.log(`Navegando a: ${YOUTUBE_VIDEO_URL}`);
    await page.goto(YOUTUBE_VIDEO_URL, { waitUntil: 'load' });

    // 2. Manejar cualquier banner de cookies que aparezca
    // Esta parte es muy dependiente de la UI actual de YouTube y puede necesitar ajustes.
    console.log('Intentando manejar el banner de cookies...');
    try {
      // Selectores comunes para el diálogo de cookies
      const cookieDialogSelectors = [
        'tp-yt-paper-dialog[id="dialog"]',
        'div[aria-modal="true"]', // Genérico para modales
        'ytd-consent-bump-v2-lightbox', // Otro selector común de YouTube
        'div. ಕೇಂದ್ರ' // Un selector específico que a veces aparece
      ];
      
      let cookieDialog = null;
      for (const selector of cookieDialogSelectors) {
        const dialog = page.locator(selector).first();
        if (await dialog.isVisible({ timeout: 2000 })) { // Breve timeout para chequear cada selector
          cookieDialog = dialog;
          console.log(`Diálogo de cookies encontrado con el selector: ${selector}`);
          break;
        }
      }

      if (cookieDialog && await cookieDialog.isVisible({ timeout: 5000 })) {
        // Intentar encontrar un botón de "Aceptar todo" o similar
        const acceptButton = cookieDialog.getByRole('button', { name: /Accept all|Aceptar todo|Accept|Aceptar/i }).first();
        
        if (await acceptButton.isVisible({ timeout: 3000 })) {
          console.log('Banner de cookies detectado. Haciendo clic en el botón de aceptar.');
          await acceptButton.click({ force: true }); // force: true por si hay overlays
          await page.waitForTimeout(2000); // Esperar a que el banner desaparezca
          console.log('Botón de aceptar cookies clickeado.');
        } else {
          console.log('Botón de aceptar cookies no encontrado con la estrategia principal en el diálogo visible.');
          // Estrategia de fallback: buscar otros botones comunes de consentimiento
          const commonButtons = cookieDialog.locator('button');
          for (let i = 0; i < await commonButtons.count(); i++) {
            const button = commonButtons.nth(i);
            const buttonText = await button.textContent();
            if (buttonText && /accept|agree|consent|aceptar|conceder|confirm/i.test(buttonText)) {
              console.log(`Botón de consentimiento potencial encontrado con texto: "${buttonText}". Clickeando.`);
              await button.click({ force: true });
              await page.waitForTimeout(2000);
              break;
            }
          }
        }
      } else {
         // Intentar con un selector más general si el diálogo no es detectado
        const simpleAcceptButton = page.locator(
          'button[aria-label*="Accept the use of cookies"], button[aria-label*="Aceptar el uso de cookies"], button:has-text(/^(Accept all|Aceptar todo)$/i)'
        ).first();
        if (await simpleAcceptButton.isVisible({ timeout: 3000 })) {
          console.log('Banner de cookies simple encontrado. Clickeando.');
          await simpleAcceptButton.click({ force: true });
          await page.waitForTimeout(2000);
        } else {
          console.log('No se detectó o no se pudo manejar el banner de cookies con las estrategias actuales.');
        }
      }
    } catch (error) {
      console.warn('No se encontró el banner de cookies o no se pudo manejar:', error.message);
    }

    // 3. Espera a que el elemento principal de video sea visible
    const videoPlayerContainerSelector = 'div#movie_player'; // Contenedor del reproductor
    const videoElementSelector = `${videoPlayerContainerSelector} video.html5-main-video`;
    const videoElement = page.locator(videoElementSelector);

    console.log('Esperando a que el elemento de video principal sea visible...');
    try {
      await videoElement.waitFor({ state: 'visible', timeout: 20000 }); // Timeout incrementado
      console.log('Elemento de video principal visible.');
    } catch (e) {
      console.error('El elemento de video no se hizo visible a tiempo.');
      // Comprobar si hay un anuncio y un botón para saltarlo
      const skipAdButtonSelectors = [
        '.ytp-ad-skip-button-modern', 
        '.ytp-ad-skip-button',
        page.getByRole('button', { name: /Skip Ad|Saltar anuncio/i })
      ];

      let adSkipped = false;
      for (const selector of skipAdButtonSelectors) {
        const skipButton = page.locator(selector).first();
        if (await skipButton.isVisible({ timeout: 5000 })) {
          console.log('Anuncio detectado. Intentando saltar anuncio...');
          await skipButton.click({ force: true });
          await page.waitForTimeout(2000); // Esperar a que el anuncio se salte
          await videoElement.waitFor({ state: 'visible', timeout: 10000 });
          console.log('Elemento de video visible después de saltar el anuncio.');
          adSkipped = true;
          break;
        }
      }
      if (!adSkipped) {
        console.log('No se encontró botón para saltar anuncio. El video podría no cargarse.');
        await page.screenshot({ path: 'debug_video_not_visible.png', fullPage: true });
        throw e; // Relanzar el error si no es un problema de anuncio que podamos resolver
      }
    }

    // 4. Haz clic en el botón de "play" si el video no se reproduce automáticamente
    // Asegurarse de que el video esté lo suficientemente cargado para verificar su estado
    console.log('Esperando a que el video tenga datos suficientes (readyState >= 2)...');
    try {
        await page.waitForFunction(selector => {
            const video = document.querySelector(selector) as HTMLVideoElement;
            return video && video.readyState >= 2; // HAVE_CURRENT_DATA o superior
        }, videoElementSelector, { timeout: 15000 });
    } catch (err) {
        console.warn("El video no alcanzó readyState >= 2 en el tiempo esperado. Continuando de todas formas...");
    }


    let isPaused = await videoElement.evaluate(video => (video as HTMLVideoElement).paused);
    console.log(`Video inicialmente pausado: ${isPaused}`);

    if (isPaused) {
      // Comprobar si hay un botón de reproducción grande superpuesto (común en la primera carga)
      const largePlayButton = page.locator('button.ytp-large-play-button');
      if (await largePlayButton.isVisible({ timeout: 3000 })) {
        console.log('Botón de reproducción grande visible. Haciendo clic.');
        await largePlayButton.click();
      } else {
        // Si no, usar el botón de reproducción de la barra de controles
        const playButton = page.locator(`${videoPlayerContainerSelector} button.ytp-play-button`);
        console.log('Botón de reproducción estándar en la barra de control. Haciendo clic.');
        await playButton.click();
      }
      await page.waitForTimeout(1000); // Dar un momento para que comience la reproducción
    }

    // 5. Verifica que el video no esté pausado
    console.log('Verificando que el video se esté reproduciendo...');
    await expect.poll(async () => {
        return videoElement.evaluate(video => (video as HTMLVideoElement).paused);
    }, {
        message: 'El video debería estar reproduciéndose (la propiedad "paused" debería ser false)',
        timeout: 10000, // Tiempo máximo para esperar a que comience la reproducción
    }).toBe(false);
    console.log('El video se está reproduciendo.');

    // 6. Realiza un scroll hacia abajo de forma gradual en la página
    console.log('Haciendo scroll hacia abajo gradualmente...');
    const scrollDownIterations = 5; // Número de pasos de scroll
    const scrollStepPixels = 400;   // Píxeles por paso
    for (let i = 0; i < scrollDownIterations; i++) {
        await page.mouse.wheel(0, scrollStepPixels); // deltaY positivo para scroll hacia abajo
        await page.waitForTimeout(300); // Pausa breve entre scrolls
    }
    console.log('Scroll hacia abajo completado.');

    // 7. Realiza un scroll hacia arriba de forma gradual hasta el inicio del video
    console.log('Haciendo scroll hacia arriba gradualmente hasta el inicio del video...');
    const videoTopTargetMinY = 0;  // El inicio del video debe estar cerca de la parte superior del viewport
    const videoTopTargetMaxY = 30; // Un pequeño margen
    let maxScrollUpAttempts = 30;
    
    for (let attempts = 0; attempts < maxScrollUpAttempts; attempts++) {
        const videoRect = await videoElement.evaluate(el => {
            const { y } = el.getBoundingClientRect();
            return { y };
        });

        if (videoRect.y === null) {
            console.warn('No se pudo obtener la posición Y del video durante el scroll hacia arriba.');
            break;
        }
        
        // Si el inicio del video está dentro del rango deseado
        if (videoRect.y >= videoTopTargetMinY && videoRect.y <= videoTopTargetMaxY) {
            console.log(`Video posicionado cerca del inicio del viewport (Y: ${videoRect.y}).`);
            break;
        }

        let scrollDelta = 0;
        if (videoRect.y > videoTopTargetMaxY) { // El video está demasiado abajo, necesitamos subir la página
            scrollDelta = -Math.min(150, videoRect.y - videoTopTargetMaxY); // Scroll hacia arriba (negativo)
        } else { // El video está demasiado arriba (y < videoTopTargetMinY), necesitamos bajar la página
            scrollDelta = Math.min(150, videoTopTargetMinY - videoRect.y); // Scroll hacia abajo (positivo)
        }
        
        // console.log(`Posición Y actual del video: ${videoRect.y}. Scroll Delta: ${scrollDelta}`);
        await page.mouse.wheel(0, scrollDelta);
        await page.waitForTimeout(150); // Pausa más corta para un scroll más granular

        if (attempts === maxScrollUpAttempts - 1) {
            console.warn('Se alcanzó el máximo de intentos de scroll hacia arriba. El video podría no estar perfectamente posicionado.');
        }
    }
    await page.waitForTimeout(500); // Pequeña pausa para estabilizar la vista
    console.log('Scroll hacia arriba completado.');

    // 8. Espera unos segundos al final del test para visualización
    const finalWaitSeconds = 5;
    console.log(`Test finalizado. Esperando ${finalWaitSeconds} segundos para visualización...`);
    await page.waitForTimeout(finalWaitSeconds * 1000);
  });
});