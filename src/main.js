/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // purchase — это одна из записей в поле items из чека в data.purchase_records
   // _product — это продукт из коллекции data.products
    const { discount, quantity, sale_price } = purchase;
    const discountDecimal = discount / 100;
    return sale_price * quantity * (1 - discountDecimal);
   // @TODO: Расчет прибыли от операции
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;

    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
    // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (
        !data ||
        !Array.isArray(data.sellers) ||
        data.sellers.length === 0 ||
        !Array.isArray(data.products) ||
        data.products.length === 0 ||
        ! Array.isArray(data.purchase_records) ||
        data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций
    if (
        !options ||
        typeof options.calculateRevenue !==
        'function' ||
        typeof options.calculateBonus !==
        'function'
    ) {
        throw new Error('Отсутствуют или некорректны функции в options');
    }

    const { calculateRevenue, calculateBonus } = options;

    // @TODO: Подготовка промежуточных данных для сбора статистики
       const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
       }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = sellerStats.reduce((result, seller) => {
        result[seller.id] = seller;
        return result;
    }, {});

    const productIndex = data.products.reduce((result, product) => {
        result[product.sku] = product;
        return result;
    }, {});

    // @TODO: Расчет выручки и прибыли для каждого продавца
   data.purchase_records.forEach(record => {
    const seller = sellerIndex[record.seller_id];//Получаем продавца по id

    //Увеличиваем общее число продаж и выручку на сумму чека
    seller.sales_count += 1;
    seller.revenue +=
    record.total_amount;

    //Проход по всем товарам в чеке
    record.items.forEach(item => {
        const product = productIndex[item.sku];//Находим товар по артикулу

        //Себестоимость: цена закупки * количество
        const cost = product.purchase_price * item.quantity;

        //Выручка с учётом скидки (используем функцию из options)
        const revenue = calculateRevenue(item, product);

        //Прибыль = выручка - себестимость
        const profit = revenue - cost;

        //Добавляем прибыль продавцу
        seller.profit += profit;

        //Учёт проданных единиц товара
        if (!
            seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }

            seller.products_sold[item.sku] += item.quantity;
    });
   });

    // @TODO: Сортировка продавцов по прибыли
    //(по убыванию)
    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        const total = sellerStats.length;
        seller.bonus = calculateBonus(index, total, seller);
    });

    //Формирование списка топовых товаров по колличеству
    sellerStats.forEach(seller => {
        const sorted = Object.entries(seller.products_sold)
        .sort((a, b) => b[1] - a[1])
        .slice(0,10)
        .map(([sku, quantity]) => ({
            sku,
            quantity
        }));

        seller.top_products = sorted;
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller =>
         ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}