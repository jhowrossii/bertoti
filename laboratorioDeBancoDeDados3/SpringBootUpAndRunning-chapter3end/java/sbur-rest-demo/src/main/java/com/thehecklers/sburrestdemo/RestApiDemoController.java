package com.thehecklers.sburrestdemo;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/coffees")
public class RestApiDemoController {

    private final CoffeeRepository coffeeRepository;

    public RestApiDemoController(CoffeeRepository coffeeRepository) {
        this.coffeeRepository = coffeeRepository;

        if (coffeeRepository.count() == 0) {
            coffeeRepository.saveAll(List.of(
                    new Coffee("Café Cereza"),
                    new Coffee("Café Ganador"),
                    new Coffee("Café Lareño"),
                    new Coffee("Café Três Pontas")
            ));
        }
    }

    @GetMapping
    public List<Coffee> getCoffees() {
        return coffeeRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Coffee> getCoffeeById(@PathVariable String id) {
        return coffeeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Coffee postCoffee(@RequestBody Coffee coffee) {
        if (coffee.getId() == null) {
            coffee = new Coffee(coffee.getName());
        }
        return coffeeRepository.save(coffee);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Coffee> putCoffee(@PathVariable String id,
                                            @RequestBody Coffee coffee) {
        return coffeeRepository.findById(id)
                .map(existingCoffee -> {
                    existingCoffee.setName(coffee.getName());
                    coffeeRepository.save(existingCoffee);
                    return ResponseEntity.ok(existingCoffee);
                })
                .orElseGet(() -> {
                    coffee.setId(id);
                    Coffee saved = coffeeRepository.save(coffee);
                    return new ResponseEntity<>(saved, HttpStatus.CREATED);
                });
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoffee(@PathVariable String id) {
        if (coffeeRepository.existsById(id)) {
            coffeeRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
