import { test, expect } from '@playwright/test';

test('playwright', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  console.log('Test "has title": Navegado a playwright.dev');
  await expect(page).toHaveTitle(/Playwright/);
  console.log('Test "has title": Título verificado.');
});

test('playwright link', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  console.log('Test "get started link": Navegado a playwright.dev');
  await page.getByRole('link', { name: 'Get started' }).click();
  console.log('Test "get started link": Clic en "Get started" realizado.');
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  console.log('Test "get started link": Encabezado "Installation" verificado.');
});

test('MercadoLibre', async ({ page }) => {
  await page.goto('https://mercadolibre.com.co/');
  console.log('Test MercadoLibre: Navegado a mercadolibre.com.co');
  const searchInput = page.locator('input[id=\'cb1-edit\']'); 
  await searchInput.fill('Iphone');
  console.log('Test MercadoLibre: Campo de búsqueda llenado con "Iphone"');
  await page.keyboard.press('Enter');
  console.log('Test MercadoLibre: Presionado Enter en el campo de búsqueda');
  const resultsContainerLocator = page.locator('ol.ui-search-layout.ui-search-layout--stack');
  console.log('Test MercadoLibre: Esperando a que el contenedor de resultados sea visible...');
  await expect(resultsContainerLocator).toBeVisible({ timeout: 20000 }); 
  console.log('Test MercadoLibre: ¡El contenedor de resultados es visible!');
  const primerResultado = resultsContainerLocator.locator('li.ui-search-layout__item').first();
  await expect(primerResultado).toBeVisible({ timeout: 10000 }); 
  console.log('Test MercadoLibre: ¡Al menos un resultado de búsqueda es visible!');
  const productTitleLocator = 'li.ui-search-layout__item h3.poly-component__title-wrapper a.poly-component__title';
  const titles = await resultsContainerLocator.locator(productTitleLocator).allInnerTexts();
  console.log('--------------------------------------------------');
  console.log(`Número total de títulos encontrados: ${titles.length}`);
  console.log('--------------------------------------------------');
  if (titles.length > 0) {
    for (let i = 0; i < titles.length; i++) {
      console.log(`Título ${i + 1}: ${titles[i]}`);
    }
  } else {
    console.log('No se encontraron títulos de productos con el selector especificado.');
  }
  console.log('--------------------------------------------------');
  console.log('Test MercadoLibre: Prueba finalizada.');
}); // Cierre correcto del test de MercadoLibre

test('Pool de Usuarios sin pausa', async ({ page }) => {
  
  await page.goto('http://10.100.43.14:4242/#/poolusuarios');
  console.log('PoolUsuarios: Navegado a la página del pool.');

  console.log('PoolUsuarios: Intentando seleccionar ambiente...');
  await page.selectOption('select#environmentOption', { label: 'STG' }); 
  console.log('PoolUsuarios: Seleccionado ambiente STG.');
  
  const tipoUsuarioInput = page.locator('input#codigo');
  await expect(tipoUsuarioInput).toBeVisible({ timeout: 10000 });
  await expect(tipoUsuarioInput).toBeEditable({ timeout: 5000 });
  console.log('PoolUsuarios: Campo "Tipo de usuario" está visible y editable.');

  await tipoUsuarioInput.fill('cuenta');
  console.log('PoolUsuarios: Escrito "cuenta" en el input de tipo de usuario.');
 
  // La pausa ha sido comentada para que no se abra el Inspector
  // console.log('PoolUsuarios: Pausando para que inspecciones las opciones después de escribir "cuenta".');
  // console.log('Verifica el texto exacto y la estructura HTML de la opción "cuenta con saldo y bolsillo".');
  // await page.pause(); // Primera pausa comentada

  const opcionCuentaConSaldoYBolsillo = page.getByText('cuenta con saldo y bolsillo', { exact: true });
  
  console.log('PoolUsuarios: Intentando verificar visibilidad de "cuenta con saldo y bolsillo"...');
  await expect(opcionCuentaConSaldoYBolsillo).toBeVisible({ timeout: 15000 }); 
  console.log('PoolUsuarios: Opción "cuenta con saldo y bolsillo" está visible.');
  
  await opcionCuentaConSaldoYBolsillo.click();
  console.log('PoolUsuarios: Seleccionado tipo de cuenta "cuenta con saldo y bolsillo".');

  const botonEjecutar = page.getByRole('button', { name: 'Ejecutar' });
  await expect(botonEjecutar).toBeVisible({ timeout: 5000 }); 
  console.log('PoolUsuarios: Botón "Ejecutar" está visible.');
  
  await botonEjecutar.click();
  console.log('PoolUsuarios: Clic en el botón "Ejecutar".');
  
  // La segunda pausa también está comentada.
  // console.log('PoolUsuarios: Acciones completadas. Pausando para inspección final del resultado.');
  // await page.pause(); 

  // Esperar un momento para que puedas ver la página con el resultado antes de que termine la prueba.
  console.log('PoolUsuarios: Esperando 5 segundos para visualizar el resultado...');
  await page.waitForTimeout(5000); // Espera 5 segundos 

  console.log('PoolUsuarios: Prueba finalizada.');
});